// netlify/functions/yandex-transcribe.ts

import { Handler } from '@netlify/functions';
import axios from 'axios';

const ONE_MB = 1024 * 1024;

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Функция для создания паузы
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Создание ответа с CORS заголовками
const createCorsResponse = (statusCode: number, body: any) => ({
  statusCode,
  headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// --- ОСНОВНОЙ ОБРАБОТЧИК ---
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return createCorsResponse(200, '');
  if (event.httpMethod !== 'POST') return createCorsResponse(405, { error: 'Method not allowed' });

  try {
    const { YANDEX_API_KEY, YANDEX_FOLDER_ID } = process.env;
    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return createCorsResponse(500, { error: 'Yandex API credentials not configured on server' });
    }

    const requestData = JSON.parse(event.body || '{}');
    const { action = 'transcribe' } = requestData;

    switch (action) {
      case 'transcribe':
        const audioBuffer = Buffer.from(requestData.audioData, 'base64');
        // В зависимости от размера файла, выбираем нужный API
        if (audioBuffer.length < ONE_MB) {
          return await recognizeSynchronously(audioBuffer, requestData.config, YANDEX_API_KEY, YANDEX_FOLDER_ID);
        } else {
          return await recognizeAsynchronously(audioBuffer, requestData.config, YANDEX_API_KEY, YANDEX_FOLDER_ID);
        }
      // Другие 'case' можно добавить здесь
      default:
        return createCorsResponse(400, { error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Yandex function error:', error);
    return createCorsResponse(500, { error: 'Internal server error', message: error.message });
  }
};

// --- СИНХРОННОЕ РАСПОЗНАВАНИЕ (< 1MB) ---
async function recognizeSynchronously(audioBuffer: Buffer, config: any, apiKey: string, folderId: string) {
  const params = new URLSearchParams({
    lang: config.languages?.[0] || 'ru-RU',
    folderId,
    format: config.format || 'lpcm',
    sampleRateHertz: config.sampleRateHertz || 16000,
    topic: 'general',
    rawResults: 'true',
  });
  const url = `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?${params.toString()}`;

  const response = await axios.post(url, audioBuffer, {
    headers: { 'Authorization': `Api-Key ${apiKey}` },
  });

  const result = processYandexV1Response(response.data, params.get('lang')!);
  return createCorsResponse(200, { success: true, result });
}

// --- АСИНХРОННОЕ РАСПОЗНАВАНИЕ (> 1MB) ---
async function recognizeAsynchronously(audioBuffer: Buffer, config: any, apiKey: string, folderId: string) {
  // Шаг 1: Отправляем файл и получаем ID операции
  const recognizeResponse = await axios.post('https://transcribe.api.cloud.yandex.net/speech/v2/longRunningRecognize', {
    config: {
      specification: {
        languageCode: '*', // Включаем автоопределение языка, v2 это умеет!
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
  }, {
    headers: { 'Authorization': `Api-Key ${apiKey}` },
  });

  const operationId = recognizeResponse.data.id;
  if (!operationId) {
    throw new Error('Failed to get operation ID from Yandex');
  }

  // Шаг 2: Проверяем статус операции, пока она не будет завершена
  let operationResult;
  const startTime = Date.now();
  const timeout = 120000; // 2 минуты на ожидание

  while (Date.now() - startTime < timeout) {
    await sleep(5000); // Ждем 5 секунд перед следующей проверкой
    const statusResponse = await axios.get(`https://operation.api.cloud.yandex.net/operations/${operationId}`, {
      headers: { 'Authorization': `Api-Key ${apiKey}` },
    });

    if (statusResponse.data.done) {
      operationResult = statusResponse.data;
      break;
    }
  }

  if (!operationResult) {
    throw new Error('Recognition timed out after 2 minutes');
  }

  const result = processYandexV2Response(operationResult);
  return createCorsResponse(200, { success: true, result });
}


// --- ОБРАБОТЧИКИ ОТВЕТОВ API ---

function processYandexV1Response(response: any, languageCode: string) {
  const chunks = response.result.split('\n').filter(Boolean).map(JSON.parse);
  if (chunks.length === 0) return createEmptyResult();
  
  const allWords = chunks.flatMap(c => c.result.words);
  const fullText = allWords.map(w => w.word).join(' ');
  
  const words = allWords.map(w => ({
    word: w.word,
    startTime: parseFloat(w.startTime),
    endTime: parseFloat(w.endTime),
    confidence: w.confidence,
    isFillerWord: isFillerWord(w.word, languageCode),
    wordType: isFillerWord(w.word, languageCode) ? 'filler' : 'word',
  }));

  const fillerWords = words.filter(w => w.isFillerWord);

  return {
    text: fullText,
    confidence: chunks[0].result.confidence,
    words,
    duration: words.length > 0 ? Math.max(...words.map(w => w.endTime)) : 0,
    detectedLanguages: [{ languageCode, probability: 1.0, text: fullText }],
    fillerWordsAnalysis: analyzeFillerWords(fillerWords, words.length, languageCode),
  };
}

function processYandexV2Response(response: any) {
  const chunks = response.response.chunks;
  if (!chunks || chunks.length === 0) return createEmptyResult();
  
  const bestAlternative = chunks[0].alternatives[0];
  const fullText = bestAlternative.text;
  const languageCode = chunks[0].channelTag === '1' ? 'ru-RU' : chunks[0].channelTag; // Упрощенное определение языка

  const words = bestAlternative.words.map(w => ({
    word: w.word,
    startTime: parseFloat(w.startTime.replace('s', '')),
    endTime: parseFloat(w.endTime.replace('s', '')),
    confidence: w.confidence,
    isFillerWord: isFillerWord(w.word, languageCode),
    wordType: isFillerWord(w.word, languageCode) ? 'filler' : 'word',
  }));

  const fillerWords = words.filter(w => w.isFillerWord);

  return {
    text: fullText,
    confidence: bestAlternative.confidence,
    words,
    duration: words.length > 0 ? Math.max(...words.map(w => w.endTime)) : 0,
    detectedLanguages: [{ languageCode, probability: 1.0, text: fullText }],
    fillerWordsAnalysis: analyzeFillerWords(fillerWords, words.length, languageCode),
  };
}

// --- ОБЩИЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function isFillerWord(word: string, lang: string): boolean {
  const fillerWordsDict = {
    'ru-RU': ['эм', 'эмм', 'ээ', 'ах', 'ну', 'мм', 'хм', 'так', 'значит', 'короче', 'типа', 'как-бы', 'вот', 'это'],
    'kk-KZ': ['әм', 'міне', 'осылай', 'яғни', 'қысқасы', 'түрі', 'сияқты'],
    'en-US': ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well', 'actually']
  };
  const normalizedWord = word.toLowerCase().trim().replace(/[.,]/g, '');
  return (fillerWordsDict[lang] || []).includes(normalizedWord);
}

function analyzeFillerWords(fillerWords: any[], totalWords: number, languageCode: string) {
  const fillerCounts = {};
  fillerWords.forEach(f => {
    const word = f.word.toLowerCase();
    if (!fillerCounts[word]) fillerCounts[word] = { count: 0, timestamps: [] };
    fillerCounts[word].count++;
    fillerCounts[word].timestamps.push(f.startTime);
  });
  
  const commonFillers = Object.entries(fillerCounts)
    .map(([word, data]: [string, any]) => ({ word, ...data }))
    .sort((a: any, b: any) => b.count - a.count);
  
  return {
    totalFillerWords: fillerWords.length,
    fillerWordsRatio: totalWords > 0 ? fillerWords.length / totalWords : 0,
    commonFillers,
    fillerWordsByLanguage: { [languageCode]: fillerWords.length }
  };
}

function createEmptyResult() {
  return {
    text: '', confidence: 0, words: [], duration: 0,
    detectedLanguages: [],
    fillerWordsAnalysis: analyzeFillerWords([], 0, 'ru-RU')
  };
}