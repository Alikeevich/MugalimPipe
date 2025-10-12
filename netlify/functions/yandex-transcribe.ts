// netlify/functions/yandex-transcribe.ts

import { Handler } from '@netlify/functions';
import axios from 'axios';

// --- ОСНОВНОЙ ОБРАБОТЧИК ---
export const handler: Handler = async (event) => {
  // Обработка CORS preflight для браузеров
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(200, '');
  }

  // Разрешаем только POST запросы
  if (event.httpMethod !== 'POST') {
    return createCorsResponse(405, { error: 'Method not allowed' });
  }

  try {
    const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
    const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return createCorsResponse(500, {
        error: 'Yandex API credentials not configured on server',
        configured: false
      });
    }

    const requestData = JSON.parse(event.body || '{}');
    const { action = 'transcribe' } = requestData;

    switch (action) {
      case 'test-connection':
        return await handleConnectionTest(YANDEX_API_KEY, YANDEX_FOLDER_ID);
      
      case 'transcribe':
        if (!requestData.audioData) {
          return createCorsResponse(400, { error: 'audioData is missing' });
        }
        return await handleTranscription(requestData, YANDEX_API_KEY, YANDEX_FOLDER_ID);
      
      default:
        return createCorsResponse(400, { error: 'Unknown action' });
    }

  } catch (error) {
    console.error('Yandex function error:', error);
    return createCorsResponse(500, { 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};


// --- ЛОГИКА ТРАНСКРИПЦИИ ---
async function handleTranscription(requestData: any, apiKey: string, folderId: string) {
  try {
    const { audioData, config = {} } = requestData;
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // --- ИСПРАВЛЕНИЕ №1: Используем API v1 ---
    // API v1 проще, надежнее для файлов до 1 МБ и поддерживает все нужные функции.
    // Автоопределение языка в v1 не поддерживается, поэтому мы берем первый язык из списка.
    const recognitionConfig = {
      lang: config.languages?.[0] || 'ru-RU', // v1 не поддерживает auto-detect, берем первый язык
      folderId: folderId, // folderId передается как параметр, а не заголовок в v1
      format: config.format || 'lpcm',
      sampleRateHertz: config.sampleRateHertz || 16000,
      profanityFilter: 'false',
      topic: 'general',
      rawResults: 'true', // Для получения детальной информации о словах
    };

    const params = new URLSearchParams(recognitionConfig);
    const url = `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?${params.toString()}`;

    const response = await axios.post(url, audioBuffer, {
      headers: {
        'Authorization': `Api-Key ${apiKey}`,
        // 'Content-Type' не нужен, axios определит его для Buffer
      },
      timeout: 120000, // 2 минуты
    });

    const processedResult = processYandexResponse(response.data, recognitionConfig.lang);
    
    return createCorsResponse(200, { success: true, result: processedResult });

  } catch (error) {
    console.error('Yandex transcription failed:', axios.isAxiosError(error) ? error.response?.data : error);
    return createCorsResponse(500, {
        success: false,
        error: `Transcription failed: ${error.message}`
    });
  }
}

// --- ТЕСТИРОВАНИЕ СОЕДИНЕНИЯ ---
async function handleConnectionTest(apiKey: string, folderId: string) {
    // Для теста достаточно просто проверить, что ключи есть.
    // Реальный запрос не нужен, чтобы не тратить квоты.
    return createCorsResponse(200, {
        success: true,
        message: 'Yandex SpeechKit credentials are configured on the server.',
        features: ['v1 API', 'Multilingual (manual select)', 'Filler Words (manual detect)'],
        configured: true
    });
}


// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Обработка ответа от Yandex и анализ слов-паразитов
function processYandexResponse(response: any, languageCode: string) {
  if (!response.result) {
    return createEmptyResult();
  }

  // В v1 ответ немного отличается, нет `alternatives`
  const wordsData = response.result.split('\n')
    .filter(Boolean)
    .map((line: string) => JSON.parse(line));
  
  if (wordsData.length === 0 || !wordsData[0].result) {
    return createEmptyResult();
  }
  
  const allWords = wordsData.flatMap(chunk => chunk.result.words);
  const fullText = allWords.map(w => w.word).join(' ');

  const words = allWords.map((word: any) => {
    const processedWord = {
      word: word.word,
      startTime: parseFloat(word.startTime),
      endTime: parseFloat(word.endTime),
      confidence: word.confidence,
      isFillerWord: false,
      wordType: 'word' as 'word' | 'filler' | 'pause' | 'noise'
    };
    
    const isFiller = isFillerWord(word.word, languageCode);
    if (isFiller) {
      processedWord.isFillerWord = true;
      processedWord.wordType = 'filler';
    }
    return processedWord;
  });

  const fillerWords = words.filter(w => w.isFillerWord);
  const fillerWordsAnalysis = analyzeFillerWords(fillerWords, words.length, languageCode);

  return {
    text: fullText,
    confidence: wordsData[0].result.confidence,
    words,
    duration: words.length > 0 ? Math.max(...words.map(w => w.endTime)) : 0,
    detectedLanguages: [{ languageCode, probability: 1.0, text: fullText }],
    fillerWordsAnalysis
  };
}

// Проверка на слово-паразит
function isFillerWord(word: string, lang: string): boolean {
  const fillerWordsDict: { [key: string]: string[] } = {
    'ru-RU': ['эм', 'эмм', 'ээ', 'ах', 'ну', 'мм', 'хм', 'так', 'значит', 'короче', 'типа', 'как-бы', 'вот', 'это'],
    'kk-KZ': ['әм', 'міне', 'осылай', 'яғни', 'қысқасы', 'түрі', 'сияқты'],
    'en-US': ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well', 'actually']
  };
  const normalizedWord = word.toLowerCase().trim().replace(/[.,]/g, '');
  const langKey = lang.split('-')[0]; // 'ru', 'kk', 'en'
  const fillers = fillerWordsDict[lang] || fillerWordsDict[`${langKey}-RU`] || fillerWordsDict[`${langKey}-US`] || [];
  return fillers.includes(normalizedWord);
}

// Анализ статистики слов-паразитов
function analyzeFillerWords(fillerWords: any[], totalWords: number, languageCode: string) {
  const fillerCounts: { [key: string]: { count: number; timestamps: number[] } } = {};
  fillerWords.forEach(filler => {
    const word = filler.word.toLowerCase();
    if (!fillerCounts[word]) {
      fillerCounts[word] = { count: 0, timestamps: [] };
    }
    fillerCounts[word].count++;
    fillerCounts[word].timestamps.push(filler.startTime);
  });
  
  const commonFillers = Object.entries(fillerCounts)
    .map(([word, data]) => ({ word, count: data.count, timestamps: data.timestamps }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalFillerWords: fillerWords.length,
    fillerWordsRatio: totalWords > 0 ? fillerWords.length / totalWords : 0,
    commonFillers,
    fillerWordsByLanguage: { [languageCode]: fillerWords.length }
  };
}

// Создание пустого результата
function createEmptyResult() {
  return {
    text: '', confidence: 0, words: [], duration: 0,
    detectedLanguages: [],
    fillerWordsAnalysis: analyzeFillerWords([], 0, 'ru-RU')
  };
}

// Создание ответа с CORS заголовками
function createCorsResponse(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}