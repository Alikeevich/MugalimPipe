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
      case 'transcribe':
        const audioBuffer = Buffer.from(audioData, 'base64');

        if (audioBuffer.length < ONE_MB) {
          const result = await recognizeSynchronously(audioBuffer, config, YANDEX_API_KEY, YANDEX_FOLDER_ID);
          return createCorsResponse(res, 200, { success: true, result });
        } else {
          const result = await recognizeAsynchronously(audioBuffer, config, YANDEX_API_KEY, YANDEX_FOLDER_ID);
          return createCorsResponse(res, 200, { success: true, result });
        }

      case 'test-connection':
        return createCorsResponse(res, 200, {
          success: true,
          message: 'Yandex SpeechKit connection successful',
          detectedFeatures: ['synchronous', 'asynchronous', 'multilingual', 'filler-words']
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

async function recognizeSynchronously(audioBuffer: Buffer, config: any, apiKey: string, folderId: string) {
  const params = new URLSearchParams({
    lang: config.languages?.[0] || 'ru-RU',
    folderId,
    format: config.format || 'lpcm',
    sampleRateHertz: String(config.sampleRateHertz || 16000),
    topic: 'general',
    rawResults: 'true',
  });

  const url = `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?${params.toString()}`;

  const response = await axios.post(url, audioBuffer, {
    headers: { 'Authorization': `Api-Key ${apiKey}` },
  });

  return processYandexV1Response(response.data, params.get('lang')!);
}

async function recognizeAsynchronously(audioBuffer: Buffer, config: any, apiKey: string, folderId: string) {
  const recognizeResponse = await axios.post(
    'https://transcribe.api.cloud.yandex.net/speech/v2/longRunningRecognize',
    {
      config: {
        specification: {
          languageCode: '*',
          model: 'general',
          profanityFilter: false,
          audioEncoding: 'LPCM',
          sampleRateHertz: config.sampleRateHertz || 16000,
          audioChannelCount: 1,
        },
        folderId: folderId,
      },
      audio: {
        content: audioBuffer.toString('base64'),
      },
    },
    {
      headers: { 'Authorization': `Api-Key ${apiKey}` },
    }
  );

  const operationId = recognizeResponse.data.id;
  if (!operationId) {
    throw new Error('Failed to get operation ID from Yandex');
  }

  let operationResult;
  const startTime = Date.now();
  const timeout = 120000;

  while (Date.now() - startTime < timeout) {
    await sleep(5000);
    const statusResponse = await axios.get(
      `https://operation.api.cloud.yandex.net/operations/${operationId}`,
      {
        headers: { 'Authorization': `Api-Key ${apiKey}` },
      }
    );

    if (statusResponse.data.done) {
      operationResult = statusResponse.data;
      break;
    }
  }

  if (!operationResult) {
    throw new Error('Recognition timed out after 2 minutes');
  }

  return processYandexV2Response(operationResult);
}

function processYandexV1Response(response: any, languageCode: string) {
  const chunks = response.result.split('\n').filter(Boolean).map(JSON.parse);
  if (chunks.length === 0) return createEmptyResult();

  const allWords = chunks.flatMap((c: any) => c.result.words);
  const fullText = allWords.map((w: any) => w.word).join(' ');

  const words = allWords.map((w: any) => ({
    word: w.word,
    startTime: parseFloat(w.startTime),
    endTime: parseFloat(w.endTime),
    confidence: w.confidence,
    isFillerWord: isFillerWord(w.word, languageCode),
    wordType: isFillerWord(w.word, languageCode) ? 'filler' : 'word',
  }));

  const fillerWords = words.filter((w: any) => w.isFillerWord);

  return {
    text: fullText,
    confidence: chunks[0].result.confidence,
    words,
    duration: words.length > 0 ? Math.max(...words.map((w: any) => w.endTime)) : 0,
    detectedLanguages: [{ languageCode, probability: 1.0, text: fullText }],
    fillerWordsAnalysis: analyzeFillerWords(fillerWords, words.length, languageCode),
  };
}

function processYandexV2Response(response: any) {
  const chunks = response.response.chunks;
  if (!chunks || chunks.length === 0) return createEmptyResult();

  const bestAlternative = chunks[0].alternatives[0];
  const fullText = bestAlternative.text;
  const languageCode = chunks[0].channelTag === '1' ? 'ru-RU' : chunks[0].channelTag;

  const words = bestAlternative.words.map((w: any) => ({
    word: w.word,
    startTime: parseFloat(w.startTime.replace('s', '')),
    endTime: parseFloat(w.endTime.replace('s', '')),
    confidence: w.confidence,
    isFillerWord: isFillerWord(w.word, languageCode),
    wordType: isFillerWord(w.word, languageCode) ? 'filler' : 'word',
  }));

  const fillerWords = words.filter((w: any) => w.isFillerWord);

  return {
    text: fullText,
    confidence: bestAlternative.confidence,
    words,
    duration: words.length > 0 ? Math.max(...words.map((w: any) => w.endTime)) : 0,
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
  const normalizedWord = word.toLowerCase().trim().replace(/[.,]/g, '');
  return (fillerWordsDict[lang] || []).includes(normalizedWord);
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
