// src/services/AudioAnalysisService.ts

import { AudioExtractionService } from './AudioExtractionService';
import { YandexSpeechKitService, type TranscriptionResult } from './YandexSpeechKitService';

// --- ИНТЕРФЕЙСЫ ---

/**
 * Конфигурация для сервиса анализа аудио
 */
export interface AudioAnalysisConfig {
  useYandexSpeechKit: boolean;
  languages?: string[];
  autoDetectLanguage?: boolean;
  includeFillerWords?: boolean;
}

/**
 * Комплексный результат анализа аудио
 */
export interface AudioAnalysisResult {
  validation: ReturnType<typeof AudioExtractionService.validateAudioBuffer>;
  characteristics: ReturnType<typeof AudioExtractionService.analyzeAudioCharacteristics>;
  transcriptionMetadata: {
    source: 'yandex' | 'mock';
    confidence: number;
    detectedLanguages?: Array<{ languageCode: string; probability: number; text: string }>;
    isMultilingual: boolean;
    languageSwitches: number;
    fillerWordsDetected: boolean;
    fillerWordsCount: number;
  };
  vocabulary: {
    wordCount: number;
    uniqueWordCount: number;
    speakingRate: number; // слов в минуту
    fillerWords: number;
    fillerWordsRatio: number;
    fillerWordsAnalysis?: TranscriptionResult['fillerWordsAnalysis'];
  };
  transcription: string;
}

// --- СЕРВИС ---

class AudioAnalysisService {
  private config: AudioAnalysisConfig;
  private yandexService: YandexSpeechKitService;

  constructor() {
    this.config = {
      useYandexSpeechKit: false,
      languages: ['ru-RU', 'kk-KZ', 'en-US'],
      autoDetectLanguage: true,
      includeFillerWords: true,
    };
    
    // Инициализируем Yandex сервис с базовой конфигурацией
    this.yandexService = new YandexSpeechKitService({
      languages: this.config.languages,
      autoDetectLanguage: this.config.autoDetectLanguage,
      includeFillerWords: this.config.includeFillerWords,
    });
  }

  /**
   * Обновляет конфигурацию сервиса
   */
  updateConfig(newConfig: Partial<AudioAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Обновляем конфигурацию Yandex сервиса
    this.yandexService.updateConfig({
      languages: this.config.languages,
      autoDetectLanguage: this.config.autoDetectLanguage,
      includeFillerWords: this.config.includeFillerWords,
    });
    
    console.log('AudioAnalysisService config updated:', this.config);
  }

  /**
   * Выполняет полный анализ аудио из видеофайла
   */
  async analyzeAudio(
    videoFile: File,
    onProgress: (progress: number) => void
  ): Promise<AudioAnalysisResult> {
    
    // 1. Извлечение аудио (0% -> 30%)
    onProgress(5);
    const audioBuffer = await AudioExtractionService.extractAudioFromVideo(videoFile);
    onProgress(30);

    // 2. Анализ и валидация аудио характеристик (30% -> 40%)
    const characteristics = AudioExtractionService.analyzeAudioCharacteristics(audioBuffer);
    const validation = AudioExtractionService.validateAudioBuffer(audioBuffer);
    onProgress(40);

    // 3. Конвертация в WAV для транскрипции (40% -> 50%)
    const audioBlob = AudioExtractionService.audioBufferToWav(audioBuffer);
    onProgress(50);
    
    // 4. Транскрипция аудио (50% -> 90%)
    let transcriptionResult: TranscriptionResult;
    let transcriptionSource: 'yandex' | 'mock' = 'mock';

    if (this.config.useYandexSpeechKit) {
      try {
        console.log('🎤 Starting Yandex SpeechKit transcription...');
        transcriptionResult = await this.yandexService.transcribeAudio(audioBlob);
        transcriptionSource = 'yandex';
        console.log('✅ Yandex SpeechKit transcription successful');
      } catch (error) {
        console.error('❌ Yandex SpeechKit transcription failed, using mock data:', error);
        transcriptionResult = this._generateMockTranscription(characteristics.duration);
      }
    } else {
      console.log('🎧 Using mock transcription service...');
      transcriptionResult = this._generateMockTranscription(characteristics.duration);
    }
    onProgress(90);

    // 5. Анализ словаря и речи (90% -> 100%)
    const vocabularyAnalysis = this._analyzeVocabulary(transcriptionResult, characteristics.duration);
    
    // 6. Формирование итогового результата
    const finalResult: AudioAnalysisResult = {
      validation,
      characteristics,
      transcriptionMetadata: {
        source: transcriptionSource,
        confidence: transcriptionResult.confidence,
        detectedLanguages: transcriptionResult.detectedLanguages,
        isMultilingual: (transcriptionResult.detectedLanguages?.length || 0) > 1,
        languageSwitches: transcriptionResult.mixedLanguageSegments?.length ? transcriptionResult.mixedLanguageSegments.length - 1 : 0,
        fillerWordsDetected: (transcriptionResult.fillerWordsAnalysis?.totalFillerWords || 0) > 0,
        fillerWordsCount: transcriptionResult.fillerWordsAnalysis?.totalFillerWords || 0,
      },
      vocabulary: vocabularyAnalysis,
      transcription: transcriptionResult.text,
    };
    onProgress(100);
    
    return finalResult;
  }

  /**
   * Генерирует моковый результат транскрипции для демонстрации
   */
  private _generateMockTranscription(duration: number): TranscriptionResult {
    const text = `Добро пожаловать на урок. Эм... сегодня мы рассмотрим важную тему. 
    Бүгін біз жаңа тақырыпты талқылаймыз. 
    Ну, как бы, это очень интересно. Let's start.`;
    
    const words = text.split(/\s+/).filter(w => w);
    const mockWords = words.map((word, index) => ({
      word,
      startTime: (index / words.length) * duration,
      endTime: ((index + 0.8) / words.length) * duration,
      confidence: 0.8 + Math.random() * 0.15,
      isFillerWord: ['эм...', 'ну,', 'как', 'бы,'].includes(word.toLowerCase()),
      wordType: ['эм...', 'ну,', 'как', 'бы,'].includes(word.toLowerCase()) ? 'filler' : 'word' as 'word' | 'filler'
    }));

    return {
      text,
      confidence: 0.85,
      words: mockWords,
      duration,
      detectedLanguages: [
        { languageCode: 'ru-RU', probability: 0.7, text: 'Добро пожаловать ... интересно.' },
        { languageCode: 'kk-KZ', probability: 0.2, text: 'Бүгін біз...' },
        { languageCode: 'en-US', probability: 0.1, text: "Let's start." },
      ],
      mixedLanguageSegments: [],
      fillerWordsAnalysis: {
        totalFillerWords: 4,
        fillerWordsRatio: 4 / words.length,
        commonFillers: [
          { word: 'эм...', count: 1, timestamps: [mockWords[4].startTime] },
          { word: 'ну,', count: 1, timestamps: [mockWords[12].startTime] },
          { word: 'как', count: 1, timestamps: [mockWords[13].startTime] },
          { word: 'бы,', count: 1, timestamps: [mockWords[14].startTime] }
        ],
        fillerWordsByLanguage: { 'ru-RU': 4 }
      }
    };
  }
  
  /**
   * Анализирует результат транскрипции для получения метрик словаря
   */
  private _analyzeVocabulary(transcriptionResult: TranscriptionResult, duration: number) {
    const { words, fillerWordsAnalysis } = transcriptionResult;
    
    const wordCount = words.length;
    const uniqueWords = new Set(words.map(w => w.word.toLowerCase()));
    
    // Рассчитываем темп речи, исключая очень длинные паузы
    const speakingDuration = duration > 1 ? duration : 1; // Защита от деления на ноль
    const speakingRate = Math.round((wordCount / speakingDuration) * 60);

    return {
      wordCount,
      uniqueWordCount: uniqueWords.size,
      speakingRate,
      fillerWords: fillerWordsAnalysis?.totalFillerWords || 0,
      fillerWordsRatio: fillerWordsAnalysis?.fillerWordsRatio || 0,
      fillerWordsAnalysis: fillerWordsAnalysis
    };
  }
}

export const audioAnalysisService = new AudioAnalysisService();