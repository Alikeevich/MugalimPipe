import { Handler } from '@netlify/functions';
import axios from 'axios';

// Netlify Function для безопасной работы с Yandex SpeechKit API
// Ключи теперь хранятся в переменных окружения Netlify, а не в фронтенде
export const handler: Handler = async (event, context) => {
  // Разрешаем только POST запросы
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Обработка CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Получаем секретные ключи из переменных окружения Netlify
    // ВАЖНО: Эти ключи больше не попадают в фронтенд код!
    const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
    const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Yandex API credentials not configured on server',
          configured: false
        })
      };
    }

    // Парсим входные данные от фронтенда
    const requestData = JSON.parse(event.body || '{}');
    const { 
      audioData, 
      config = {},
      action = 'transcribe'
    } = requestData;

    // Обработка разных типов запросов
    switch (action) {
      case 'test-connection':
        return await handleConnectionTest(YANDEX_API_KEY, YANDEX_FOLDER_ID);
      
      case 'transcribe':
        return await handleTranscription(audioData, config, YANDEX_API_KEY, YANDEX_FOLDER_ID);
      
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Unknown action' })
        };
    }

  } catch (error) {
    console.error('Yandex transcription error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Функция тестирования подключения к Yandex API
async function handleConnectionTest(apiKey: string, folderId: string) {
  try {
    // Создаем тестовый аудио файл (1 секунда тишины)
    const testAudio = createTestAudioBuffer();
    
    const headers = {
      'Authorization': `Api-Key ${apiKey}`,
      'x-folder-id': folderId,
      'Content-Type': 'application/octet-stream'
    };

    const recognitionConfig = {
      format: 'lpcm',
      sampleRateHertz: 16000,
      profanityFilter: false,
      literature_text: false,
      raw_results: true,
      enable_word_time_offsets: true,
      lang: 'ru-RU'
    };

    const params = new URLSearchParams(recognitionConfig as any);
    const url = `https://stt.api.cloud.yandex.net/speech/v3/stt:recognize?${params.toString()}`;

    const response = await axios.post(url, testAudio, {
      headers,
      timeout: 30000
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Yandex SpeechKit connection successful',
        features: ['v3 API', 'Multilingual', 'Filler Words', 'Auto Detection'],
        configured: true
      })
    };

  } catch (error) {
    console.error('Yandex connection test failed:', error);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configured: true
      })
    };
  }
}

// Функция транскрипции аудио
async function handleTranscription(audioData: any, config: any, apiKey: string, folderId: string) {
  try {
    // Конвертируем base64 аудио данные в ArrayBuffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    const headers = {
      'Authorization': `Api-Key ${apiKey}`,
      'x-folder-id': folderId,
      'Content-Type': 'application/octet-stream'
    };

    // Конфигурация для максимального качества и детекции слов-запинок
    const recognitionConfig = {
      format: config.format || 'lpcm',
      sampleRateHertz: config.sampleRateHertz || 16000,
      profanityFilter: false, // Отключаем для сохранения слов-запинок
      literature_text: false, // Отключаем для сырого текста
      raw_results: true, // Включаем для получения всех результатов
      partial_results: true,
      enable_automatic_punctuation: false,
      enable_word_time_offsets: true,
      ...(config.autoDetectLanguage ? {
        languageRestriction: config.languages || ['ru-RU', 'kk-KZ', 'en-US'],
        autoDetectLanguage: true
      } : {
        lang: config.languages?.[0] || 'ru-RU'
      })
    };

    const params = new URLSearchParams(recognitionConfig as any);
    const url = `https://stt.api.cloud.yandex.net/speech/v3/stt:recognize?${params.toString()}`;

    const response = await axios.post(url, audioBuffer, {
      headers,
      timeout: 120000, // 2 минуты для больших файлов
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024
    });

    // Обрабатываем ответ и анализируем слова-запинки
    const processedResult = processYandexResponse(response.data, config);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        result: processedResult
      })
    };

  } catch (error) {
    console.error('Yandex transcription failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed'
      })
    };
  }
}

// Обработка ответа от Yandex API с анализом слов-запинок
function processYandexResponse(response: any, config: any) {
  if (!response.result || !response.result.alternatives || response.result.alternatives.length === 0) {
    return {
      text: '',
      confidence: 0,
      words: [],
      duration: 0,
      detectedLanguages: [],
      fillerWordsAnalysis: {
        totalFillerWords: 0,
        fillerWordsRatio: 0,
        commonFillers: [],
        fillerWordsByLanguage: {}
      }
    };
  }

  const bestAlternative = response.result.alternatives[0];
  
  // Словарь слов-запинок для разных языков
  const fillerWordsDict: { [key: string]: string[] } = {
    'ru-RU': ['эм', 'эмм', 'эммм', 'ах', 'ну', 'мм', 'ммм', 'хм', 'так', 'значит', 'короче', 'типа', 'как бы', 'вот', 'это'],
    'kk-KZ': ['әм', 'әмм', 'міне', 'осылай', 'яғни', 'қысқасы', 'түрі', 'сияқты'],
    'en-US': ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well', 'actually']
  };

  // Обрабатываем слова с временными метками
  const words = bestAlternative.words?.map((word: any) => {
    const processedWord = {
      word: word.word,
      startTime: parseTimeString(word.startTime),
      endTime: parseTimeString(word.endTime),
      confidence: word.confidence,
      isFillerWord: false,
      wordType: 'word' as 'word' | 'filler' | 'pause' | 'noise'
    };

    // Проверяем, является ли слово словом-запинкой
    const languageCode = response.result.languageCode || 'ru-RU';
    const fillers = fillerWordsDict[languageCode] || fillerWordsDict['ru-RU'];
    const normalizedWord = word.word.toLowerCase().trim();
    
    if (fillers.includes(normalizedWord)) {
      processedWord.isFillerWord = true;
      processedWord.wordType = 'filler';
    }

    return processedWord;
  }) || [];

  // Анализируем слова-запинки
  const fillerWords = words.filter(w => w.isFillerWord);
  const fillerWordsAnalysis = analyzeFillerWords(fillerWords, words.length, response.result.languageCode);

  // Определяем обнаруженные языки
  const detectedLanguages = bestAlternative.languages?.map((lang: any) => ({
    languageCode: lang.languageCode,
    probability: lang.probability,
    text: bestAlternative.text
  })) || [];

  return {
    text: bestAlternative.text,
    confidence: bestAlternative.confidence,
    words,
    duration: words.length > 0 ? Math.max(...words.map(w => w.endTime)) : 0,
    detectedLanguages,
    fillerWordsAnalysis
  };
}

// Анализ слов-запинок
function analyzeFillerWords(fillerWords: any[], totalWords: number, languageCode: string) {
  const fillerCounts: { [key: string]: { count: number; timestamps: number[] } } = {};
  
  fillerWords.forEach(filler => {
    if (!fillerCounts[filler.word]) {
      fillerCounts[filler.word] = { count: 0, timestamps: [] };
    }
    fillerCounts[filler.word].count++;
    fillerCounts[filler.word].timestamps.push(filler.startTime);
  });
  
  const commonFillers = Object.entries(fillerCounts)
    .map(([word, data]) => ({
      word,
      count: data.count,
      timestamps: data.timestamps
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalFillerWords: fillerWords.length,
    fillerWordsRatio: totalWords > 0 ? fillerWords.length / totalWords : 0,
    commonFillers,
    fillerWordsByLanguage: {
      [languageCode]: fillerWords.length
    }
  };
}

// Парсинг временных меток
function parseTimeString(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/^(\d+(?:\.\d+)?)s?$/);
  return match ? parseFloat(match[1]) : 0;
}

// Создание тестового аудио буфера
function createTestAudioBuffer(): Buffer {
  const sampleRate = 16000;
  const duration = 1; // 1 секунда
  const samples = sampleRate * duration;
  
  // Создаем WAV заголовок + тишина
  const buffer = Buffer.alloc(44 + samples * 2);
  
  // WAV заголовок
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  
  // Данные (тишина)
  buffer.fill(0, 44);
  
  return buffer;
}