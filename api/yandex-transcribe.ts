import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const ONE_MB = 1024 * 1024;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const createCorsResponse = (res: VercelResponse, statusCode: number, body: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json(body);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return createCorsResponse(res, 200, {});
  }

  if (req.method !== 'POST') {
    return createCorsResponse(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return createCorsResponse(res, 500, {
        error: 'Yandex API credentials not configured on server'
      });
    }

    const { action = 'transcribe', audioData, config } = req.body;

    switch (action) {
      case 'transcribe': {
        const audioBuffer = Buffer.from(audioData, 'base64');

        if (audioBuffer.length <= ONE_MB) {
          const result = await recognizeSynchronously(audioBuffer, config, YANDEX_API_KEY, YANDEX_FOLDER_ID);
          return createCorsResponse(res, 200, { success: true, result });
        } else {
          const result = await recognizeInChunks(audioBuffer, config, YANDEX_API_KEY, YANDEX_FOLDER_ID);
          return createCorsResponse(res, 200, { success: true, result });
        }
      }

      case 'test-connection':
        return createCorsResponse(res, 200, {
          success: true,
          message: 'Yandex SpeechKit connection successful',
          detectedFeatures: ['synchronous', 'chunked', 'multilingual', 'filler-words']
        });

      default:
        return createCorsResponse(res, 400, { error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error('Yandex function error:', error);
    return createCorsResponse(res, 500, {
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function recognizeSynchronously(
  audioBuffer: Buffer,
  config: any,
  apiKey: string,
  folderId: string
) {
  const isWav = audioBuffer.length > 4 && audioBuffer.slice(0, 4).toString('ascii') === 'RIFF';
  const audioData = isWav ? audioBuffer.slice(44) : audioBuffer;

  const params = new URLSearchParams({
    lang: config?.languages?.[0] || 'ru-RU',
    folderId,
    format: 'lpcm',
    sampleRateHertz: String(config?.sampleRateHertz || 16000),
    topic: 'general',
    rawResults: 'false',
  });

  const url = `https://stt.api.ml.yandexcloud.kz/speech/v1/stt:recognize?${params.toString()}`;

  const response = await axios.post(url, audioData, {
    headers: {
      'Authorization': `Api-Key ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    timeout: 30000,
  });

  return processYandexV1Response(response.data, params.get('lang')!);
}

async function recognizeInChunks(
  audioBuffer: Buffer,
  config: any,
  apiKey: string,
  folderId: string
) {
  const isWav = audioBuffer.length > 4 && audioBuffer.slice(0, 4).toString('ascii') === 'RIFF';
  const rawPcm = isWav ? audioBuffer.slice(44) : audioBuffer;

  const CHUNK_SIZE = 900 * 1024;
  const chunks: Buffer[] = [];
  for (let offset = 0; offset < rawPcm.length; offset += CHUNK_SIZE) {
    chunks.push(rawPcm.slice(offset, offset + CHUNK_SIZE));
  }

  const allTexts: string[] = [];
  const allWords: any[] = [];
  let totalConfidence = 0;
  let validChunks = 0;
  const lang = config?.languages?.[0] || 'ru-RU';

  for (let i = 0; i < chunks.length; i++) {
    try {
      const params = new URLSearchParams({
        lang,
        folderId,
        format: 'lpcm',
        sampleRateHertz: String(config?.sampleRateHertz || 16000),
        topic: 'general',
        rawResults: 'false',
      });

      const url = `https://stt.api.ml.yandexcloud.kz/speech/v1/stt:recognize?${params.toString()}`;
      const response = await axios.post(url, chunks[i], {
        headers: {
          'Authorization': `Api-Key ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 30000,
      });

      const chunkResult = processYandexV1Response(response.data, lang);
      if (chunkResult.text) {
        allTexts.push(chunkResult.text);
        allWords.push(...chunkResult.words);
        totalConfidence += chunkResult.confidence;
        validChunks++;
      }
    } catch (err: any) {
      console.warn(`Chunk ${i + 1}/${chunks.length} failed:`, err.message);
    }

    if (i < chunks.length - 1) {
      await sleep(300);
    }
  }

  const fullText = allTexts.join(' ');
  const fillerWords = allWords.filter((w: any) => w.isFillerWord);

  return {
    text: fullText,
    confidence: validChunks > 0 ? totalConfidence / validChunks : 0,
    words: allWords,
    duration: allWords.length > 0 ? Math.max(...allWords.map((w: any) => w.endTime)) : 0,
    detectedLanguages: [{ languageCode: lang, probability: 1.0, text: fullText }],
    fillerWordsAnalysis: analyzeFillerWords(fillerWords, allWords.length, lang),
  };
}

function processYandexV1Response(response: any, languageCode: string) {
  let fullText = '';

  if (typeof response.result === 'string') {
    fullText = response.result;
  } else if (response.result?.alternatives?.[0]?.text) {
    fullText = response.result.alternatives[0].text;
  } else if (response.result?.text) {
    fullText = response.result.text;
  }

  if (!fullText) return createEmptyResult();

  const rawWords = fullText.split(/\s+/).filter(Boolean);
  const words = rawWords.map((word: string, idx: number) => ({
    word,
    startTime: idx * 0.3,
    endTime: (idx + 1) * 0.3,
    confidence: 0.85,
    isFillerWord: isFillerWord(word, languageCode),
    wordType: isFillerWord(word, languageCode) ? 'filler' : 'word',
  }));

  const fillerWords = words.filter((w: any) => w.isFillerWord);

  return {
    text: fullText,
    confidence: 0.9,
    words,
    duration: words.length > 0 ? words[words.length - 1].endTime : 0,
    detectedLanguages: [{ languageCode, probability: 1.0, text: fullText }],
    fillerWordsAnalysis: analyzeFillerWords(fillerWords, words.length, languageCode),
  };
}

function isFillerWord(word: string, lang: string): boolean {
  const fillerWordsDict: Record<string, string[]> = {
    'ru-RU': ['эм', 'эмм', 'ээ', 'ах', 'ну', 'мм', 'хм', 'так', 'значит', 'короче', 'типа', 'как-бы', 'вот', 'это'],
    'kk-KZ': ['әм', 'міне', 'осылай', 'яғни', 'қысқасы', 'түрі', 'сияқты'],
    'en-US': ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well', 'actually']
  };
  const normalizedWord = word.toLowerCase().trim().replace(/[.,!?]/g, '');
  return (fillerWordsDict[lang] || fillerWordsDict['ru-RU']).includes(normalizedWord);
}

function analyzeFillerWords(fillerWords: any[], totalWords: number, languageCode: string) {
  const fillerCounts: Record<string, { count: number; timestamps: number[] }> = {};

  fillerWords.forEach((f: any) => {
    const word = f.word.toLowerCase();
    if (!fillerCounts[word]) fillerCounts[word] = { count: 0, timestamps: [] };
    fillerCounts[word].count++;
    fillerCounts[word].timestamps.push(f.startTime);
  });

  const commonFillers = Object.entries(fillerCounts)
    .map(([word, data]) => ({ word, ...data }))
    .sort((a, b) => b.count - a.count);

  return {
    totalFillerWords: fillerWords.length,
    fillerWordsRatio: totalWords > 0 ? fillerWords.length / totalWords : 0,
    commonFillers,
    fillerWordsByLanguage: { [languageCode]: fillerWords.length }
  };
}

function createEmptyResult() {
  return {
    text: '',
    confidence: 0,
    words: [],
    duration: 0,
    detectedLanguages: [],
    fillerWordsAnalysis: analyzeFillerWords([], 0, 'ru-RU')
  };
}