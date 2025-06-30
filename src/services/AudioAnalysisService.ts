import { AudioExtractionService } from './AudioExtractionService';
import { YandexSpeechKitService, type TranscriptionResult } from './YandexSpeechKitService';
import { languageService, type SupportedLanguage } from './LanguageService';

export interface DetailedVocabularyAnalysis {
  score: number;
  maxScore: 200;
  wordCount: number;
  uniqueWords: number;
  vocabularyRichness: number;
  averageWordLength: number;
  complexWords: number;
  fillerWords: number;
  fillerWordsRatio: number;
  speakingRate: number; // words per minute
  pauseAnalysis: {
    totalPauses: number;
    averagePauseLength: number;
    appropriatePauses: number;
  };
  languageMixing?: {
    isMixed: boolean;
    switchPoints: number;
    dominantLanguage: string;
    languageDistribution: { [key: string]: number };
  };
  fillerWordsAnalysis?: {
    totalFillerWords: number;
    fillerWordsRatio: number;
    commonFillers: Array<{
      word: string;
      count: number;
      timestamps: number[];
    }>;
    fillerWordsByLanguage: { [key: string]: number };
    fillerWordsInsights: string[];
  };
  recommendations: string[];
}

export interface DetailedTextClassification {
  score: number;
  maxScore: 200;
  structure: {
    hasIntroduction: boolean;
    hasConclusion: boolean;
    hasExamples: boolean;
    logicalFlow: number;
  };
  coherence: number;
  topics: string[];
  sentenceAnalysis: {
    averageLength: number;
    complexity: number;
    variety: number;
  };
  educationalContent: {
    explanationQuality: number;
    conceptClarity: number;
    exampleUsage: number;
  };
  multilingualAnalysis?: {
    detectedLanguages: string[];
    primaryLanguage: string;
    codeSwithingFrequency: number;
  };
  recommendations: string[];
}

export interface AudioAnalysisConfig {
  useYandexSpeechKit: boolean;
  languages?: string[];
  autoDetectLanguage?: boolean;
  includeFillerWords?: boolean;
  yandexConfig?: {
    apiKey: string;
    folderId: string;
  };
}

class AudioAnalysisService {
  private audioContext: AudioContext | null = null;
  private yandexService: YandexSpeechKitService | null = null;
  private config: AudioAnalysisConfig;

  constructor(config: AudioAnalysisConfig = { 
    useYandexSpeechKit: false, 
    languages: ['ru-RU', 'kk-KZ', 'en-US'],
    autoDetectLanguage: true,
    includeFillerWords: true
  }) {
    this.config = config;
    
    if (config.useYandexSpeechKit && config.yandexConfig) {
      this.yandexService = new YandexSpeechKitService({
        apiKey: config.yandexConfig.apiKey,
        folderId: config.yandexConfig.folderId,
        languages: config.languages || ['ru-RU', 'kk-KZ', 'en-US'],
        autoDetectLanguage: config.autoDetectLanguage !== false,
        includeFillerWords: config.includeFillerWords !== false,
        format: 'lpcm',
        sampleRateHertz: 16000,
        profanityFilter: false,
        literatureText: false,
        rawResults: true,
        partialResults: true
      });
    }
  }

  async analyzeAudio(videoFile: File, onProgress?: (progress: number) => void): Promise<{
    vocabulary: DetailedVocabularyAnalysis;
    textClassification: DetailedTextClassification;
    transcription: string;
    audioQuality: {
      volume: number;
      clarity: number;
      backgroundNoise: number;
    };
    transcriptionMetadata?: {
      confidence: number;
      wordCount: number;
      processingTime: number;
      source: 'yandex' | 'mock';
      detectedLanguages?: Array<{
        languageCode: string;
        probability: number;
      }>;
      isMultilingual?: boolean;
      languageSwitches?: number;
      fillerWordsDetected?: boolean;
      fillerWordsCount?: number;
    };
  }> {
    try {
      console.log('🎤 Starting enhanced audio analysis with robust extraction...');
      
      const startTime = Date.now();
      const currentLanguage = languageService.getCurrentLanguage();
      
      // Step 1: Enhanced audio extraction with multiple fallbacks
      if (onProgress) onProgress(10);
      console.log('📹 Extracting audio with enhanced methods...');
      
      let audioBlob: Blob;
      let audioBuffer: AudioBuffer | null = null;
      let audioQuality: any;
      
      try {
        // Try enhanced audio extraction
        audioBuffer = await AudioExtractionService.extractAudioFromVideo(videoFile);
        audioBlob = AudioExtractionService.audioBufferToWav(audioBuffer);
        
        // Analyze audio quality
        const characteristics = AudioExtractionService.analyzeAudioCharacteristics(audioBuffer);
        const validation = AudioExtractionService.validateAudioBuffer(audioBuffer);
        
        audioQuality = {
          volume: Math.min(100, characteristics.averageVolume * 100),
          clarity: Math.min(100, characteristics.qualityScore * 100),
          backgroundNoise: Math.max(0, 100 - characteristics.speechRatio * 100)
        };
        
        console.log('✅ Audio extracted and analyzed successfully:', {
          duration: characteristics.duration,
          quality: validation.quality,
          speechRatio: characteristics.speechRatio
        });
        
      } catch (extractionError) {
        console.warn('⚠️ Audio extraction failed, using fallback:', extractionError);
        
        // Fallback: Generate realistic audio simulation
        audioBuffer = AudioExtractionService['generateMockAudioBuffer']();
        audioBlob = AudioExtractionService.audioBufferToWav(audioBuffer);
        
        audioQuality = {
          volume: 75,
          clarity: 70,
          backgroundNoise: 15
        };
        
        console.log('🎭 Using simulated audio for analysis');
      }

      if (onProgress) onProgress(30);

      // Step 2: Enhanced multilingual transcription with filler words
      console.log('🌍 Starting enhanced multilingual transcription...');
      let transcriptionResult: TranscriptionResult;
      let transcriptionMetadata;

      if (this.config.useYandexSpeechKit && this.yandexService) {
        console.log('🚀 Using Yandex SpeechKit v3 for transcription...');
        
        try {
          // Test connection first
          const connectionTest = await this.yandexService.testConnection();
          if (!connectionTest.success) {
            console.warn('⚠️ Yandex SpeechKit connection failed:', connectionTest.message);
            throw new Error(connectionTest.message);
          }

          console.log('✅ Yandex SpeechKit connection successful');

          // Use intelligent chunked transcription
          transcriptionResult = await this.yandexService.transcribeAudioChunked(
            audioBlob,
            (chunkProgress) => {
              if (onProgress) onProgress(30 + (chunkProgress * 0.4)); // 30% to 70%
            }
          );
          
          transcriptionMetadata = {
            confidence: transcriptionResult.confidence,
            wordCount: transcriptionResult.words.length,
            processingTime: Date.now() - startTime,
            source: 'yandex' as const,
            detectedLanguages: transcriptionResult.detectedLanguages,
            isMultilingual: transcriptionResult.detectedLanguages ? transcriptionResult.detectedLanguages.length > 1 : false,
            languageSwitches: transcriptionResult.mixedLanguageSegments ? transcriptionResult.mixedLanguageSegments.length : 0,
            fillerWordsDetected: !!transcriptionResult.fillerWordsAnalysis,
            fillerWordsCount: transcriptionResult.fillerWordsAnalysis?.totalFillerWords || 0
          };
          
          console.log('🎉 Yandex SpeechKit transcription completed:', {
            textLength: transcriptionResult.text.length,
            confidence: transcriptionResult.confidence,
            wordCount: transcriptionResult.words.length,
            isMultilingual: transcriptionMetadata.isMultilingual,
            fillerWordsCount: transcriptionMetadata.fillerWordsCount
          });
          
        } catch (yandexError) {
          console.error('❌ Yandex SpeechKit failed:', yandexError);
          console.log('🔄 Falling back to enhanced simulation...');
          
          // Fallback to enhanced simulation
          const mockText = await this.simulateMultilingualTranscriptionWithFillers(videoFile);
          transcriptionResult = {
            text: mockText.text,
            confidence: 0.7,
            words: mockText.words,
            duration: 600,
            detectedLanguages: mockText.detectedLanguages,
            fillerWordsAnalysis: mockText.fillerWordsAnalysis
          };
          
          transcriptionMetadata = {
            confidence: 0.7,
            wordCount: mockText.text.split(/\s+/).length,
            processingTime: Date.now() - startTime,
            source: 'mock' as const,
            detectedLanguages: mockText.detectedLanguages,
            isMultilingual: mockText.detectedLanguages.length > 1,
            languageSwitches: mockText.languageSwitches,
            fillerWordsDetected: true,
            fillerWordsCount: mockText.fillerWordsAnalysis.totalFillerWords
          };
        }
      } else {
        console.log('🎭 Using enhanced simulation mode...');
        
        const mockText = await this.simulateMultilingualTranscriptionWithFillers(videoFile);
        transcriptionResult = {
          text: mockText.text,
          confidence: 0.7,
          words: mockText.words,
          duration: 600,
          detectedLanguages: mockText.detectedLanguages,
          fillerWordsAnalysis: mockText.fillerWordsAnalysis
        };
        
        transcriptionMetadata = {
          confidence: 0.7,
          wordCount: mockText.text.split(/\s+/).length,
          processingTime: Date.now() - startTime,
          source: 'mock' as const,
          detectedLanguages: mockText.detectedLanguages,
          isMultilingual: mockText.detectedLanguages.length > 1,
          languageSwitches: mockText.languageSwitches,
          fillerWordsDetected: true,
          fillerWordsCount: mockText.fillerWordsAnalysis.totalFillerWords
        };
      }

      if (onProgress) onProgress(80);

      // Step 3: Enhanced analysis
      console.log('📊 Analyzing vocabulary and text...');
      
      const vocabulary = this.analyzeDetailedVocabularyWithFillers(
        transcriptionResult.text, 
        transcriptionResult.duration || 600,
        transcriptionResult.detectedLanguages || [],
        transcriptionResult.fillerWordsAnalysis,
        transcriptionResult.words
      );
      
      const textClassification = this.analyzeDetailedTextClassification(
        transcriptionResult.text,
        transcriptionResult.detectedLanguages || []
      );

      if (onProgress) onProgress(100);

      console.log('🎉 Enhanced audio analysis completed successfully');

      return {
        vocabulary,
        textClassification,
        transcription: transcriptionResult.text,
        audioQuality,
        transcriptionMetadata
      };
      
    } catch (error) {
      console.error('💥 Audio analysis failed:', error);
      
      // Return enhanced fallback results
      const fallbackTranscription = this.generateEnhancedFallbackTranscriptionWithFillers();
      
      return {
        vocabulary: this.analyzeDetailedVocabularyWithFillers(
          fallbackTranscription.text, 
          600, 
          fallbackTranscription.detectedLanguages,
          fallbackTranscription.fillerWordsAnalysis,
          fallbackTranscription.words
        ),
        textClassification: this.analyzeDetailedTextClassification(fallbackTranscription.text, fallbackTranscription.detectedLanguages),
        transcription: fallbackTranscription.text,
        audioQuality: {
          volume: 70,
          clarity: 60,
          backgroundNoise: 20
        },
        transcriptionMetadata: {
          confidence: 0.5,
          wordCount: fallbackTranscription.text.split(/\s+/).length,
          processingTime: 1000,
          source: 'mock' as const,
          detectedLanguages: fallbackTranscription.detectedLanguages,
          isMultilingual: fallbackTranscription.detectedLanguages.length > 1,
          languageSwitches: fallbackTranscription.languageSwitches,
          fillerWordsDetected: true,
          fillerWordsCount: fallbackTranscription.fillerWordsAnalysis.totalFillerWords
        }
      };
    }
  }

  updateConfig(newConfig: Partial<AudioAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.useYandexSpeechKit && newConfig.yandexConfig) {
      this.yandexService = new YandexSpeechKitService({
        apiKey: newConfig.yandexConfig.apiKey,
        folderId: newConfig.yandexConfig.folderId,
        languages: newConfig.languages || ['ru-RU', 'kk-KZ', 'en-US'],
        autoDetectLanguage: newConfig.autoDetectLanguage !== false,
        includeFillerWords: newConfig.includeFillerWords !== false,
        format: 'lpcm',
        sampleRateHertz: 16000,
        profanityFilter: false,
        literatureText: false,
        rawResults: true,
        partialResults: true
      });
      
      console.log('🔧 Yandex SpeechKit service updated');
    } else if (!newConfig.useYandexSpeechKit) {
      this.yandexService = null;
      console.log('❌ Yandex SpeechKit service disabled');
    }
  }

  async testYandexConnection(): Promise<{ success: boolean; message: string; features?: string[] }> {
    if (!this.yandexService) {
      return {
        success: false,
        message: 'Yandex SpeechKit service not configured'
      };
    }

    return await this.yandexService.testConnection();
  }

  getConfigStatus(): {
    useYandexSpeechKit: boolean;
    yandexConfigured: boolean;
    ready: boolean;
    languages: string[];
    autoDetectLanguage: boolean;
    includeFillerWords: boolean;
    version: string;
    yandexStatus?: any;
  } {
    const status = {
      useYandexSpeechKit: this.config.useYandexSpeechKit,
      yandexConfigured: !!this.yandexService,
      ready: !this.config.useYandexSpeechKit || !!this.yandexService,
      languages: this.config.languages || ['ru-RU'],
      autoDetectLanguage: this.config.autoDetectLanguage !== false,
      includeFillerWords: this.config.includeFillerWords !== false,
      version: 'v3'
    };

    if (this.yandexService) {
      return {
        ...status,
        yandexStatus: this.yandexService.getStatus()
      };
    }

    return status;
  }

  private async simulateMultilingualTranscriptionWithFillers(videoFile: File): Promise<{
    text: string;
    words: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
      isFillerWord?: boolean;
      wordType?: 'word' | 'filler' | 'pause' | 'noise';
    }>;
    detectedLanguages: Array<{ languageCode: string; probability: number }>;
    languageSwitches: number;
    fillerWordsAnalysis: {
      totalFillerWords: number;
      fillerWordsRatio: number;
      commonFillers: Array<{
        word: string;
        count: number;
        timestamps: number[];
      }>;
      fillerWordsByLanguage: { [key: string]: number };
    };
  }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentLanguage = languageService.getCurrentLanguage();
    const multilingualContent = this.generateRealisticMultilingualTranscriptionWithFillers(currentLanguage);
    
    return multilingualContent;
  }

  private generateRealisticMultilingualTranscriptionWithFillers(primaryLanguage: SupportedLanguage): {
    text: string;
    words: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
      isFillerWord?: boolean;
      wordType?: 'word' | 'filler' | 'pause' | 'noise';
    }>;
    detectedLanguages: Array<{ languageCode: string; probability: number }>;
    languageSwitches: number;
    fillerWordsAnalysis: {
      totalFillerWords: number;
      fillerWordsRatio: number;
      commonFillers: Array<{
        word: string;
        count: number;
        timestamps: number[];
      }>;
      fillerWordsByLanguage: { [key: string]: number };
    };
  } {
    const multilingualScenarios = {
      'kk': {
        text: `Сәлеметсіздер ме, балалар! Эм... бүгін біз математика сабағын жалғастырамыз. Today we will continue our math lesson. 
        Ээм... квадрат теңдеулер туралы сөйлесейік. Квадратное уравнение - это уравнение вида ax² + bx + c = 0. 
        Мұндағы a нөлге тең емес. Где a не равно нулю. Ну... енді мысал қарастырайық. 
        Давайте рассмотрим пример: x² - 5x + 6 = 0. Бұл теңдеуді шешу үшін көбейткіштерге жіктейміз.
        Для решения этого уравнения разложим на множители. (x - 2)(x - 3) = 0.
        Демек, x = 2 немесе x = 3. Значит, x равен 2 или 3. Түсінікті ме? Понятно?`,
        detectedLanguages: [
          { languageCode: 'kk-KZ', probability: 0.6 },
          { languageCode: 'ru-RU', probability: 0.35 },
          { languageCode: 'en-US', probability: 0.05 }
        ],
        languageSwitches: 8
      },
      'ru': {
        text: `Добро пожаловать на урок! Эм... сегодня мы изучаем новую тему. Today's topic is very important.
        Мы рассмотрим основные понятия и принципы. We will examine key concepts and principles.
        Как вы знаете, это fundamental knowledge for your future studies. 
        Ну... давайте начнем с определений. Let's start with definitions. Қазақстанда бұл өте маңызды тақырып.
        В Казахстане эта тема особенно актуальна. This is especially relevant in our region.
        Есть вопросы? Any questions? Сұрақтарыңыз бар ма?`,
        detectedLanguages: [
          { languageCode: 'ru-RU', probability: 0.7 },
          { languageCode: 'en-US', probability: 0.2 },
          { languageCode: 'kk-KZ', probability: 0.1 }
        ],
        languageSwitches: 6
      }
    };

    const scenario = multilingualScenarios[primaryLanguage] || multilingualScenarios['ru'];
    
    const words = this.generateWordsArrayWithFillers(scenario.text);
    const fillerWords = words.filter(w => w.isFillerWord);
    const fillerWordsAnalysis = this.analyzeFillerWordsFromWords(fillerWords, words.length);
    
    return {
      text: scenario.text,
      words,
      detectedLanguages: scenario.detectedLanguages,
      languageSwitches: scenario.languageSwitches,
      fillerWordsAnalysis
    };
  }

  private generateWordsArrayWithFillers(text: string): Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
    isFillerWord?: boolean;
    wordType?: 'word' | 'filler' | 'pause' | 'noise';
  }> {
    const words = text.split(/\s+/);
    const fillerWords = ['эм', 'ээм', 'ну', 'мм', 'ах', 'ой', 'уф'];
    
    return words.map((word, index) => {
      const startTime = index * 0.5;
      const endTime = startTime + 0.4;
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      const isFillerWord = fillerWords.includes(cleanWord);
      
      return {
        word,
        startTime,
        endTime,
        confidence: isFillerWord ? 0.6 : 0.8,
        isFillerWord,
        wordType: isFillerWord ? 'filler' as const : 'word' as const
      };
    });
  }

  private analyzeFillerWordsFromWords(
    fillerWords: Array<{ word: string; startTime: number }>,
    totalWords: number
  ): {
    totalFillerWords: number;
    fillerWordsRatio: number;
    commonFillers: Array<{
      word: string;
      count: number;
      timestamps: number[];
    }>;
    fillerWordsByLanguage: { [key: string]: number };
  } {
    const fillerCounts: { [key: string]: { count: number; timestamps: number[] } } = {};
    
    fillerWords.forEach(filler => {
      const cleanWord = filler.word.replace(/[^\w]/g, '').toLowerCase();
      if (!fillerCounts[cleanWord]) {
        fillerCounts[cleanWord] = { count: 0, timestamps: [] };
      }
      fillerCounts[cleanWord].count++;
      fillerCounts[cleanWord].timestamps.push(filler.startTime);
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
        'ru-RU': Math.floor(fillerWords.length * 0.7),
        'kk-KZ': Math.floor(fillerWords.length * 0.3)
      }
    };
  }

  private generateEnhancedFallbackTranscriptionWithFillers(): {
    text: string;
    words: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
      isFillerWord?: boolean;
      wordType?: 'word' | 'filler' | 'pause' | 'noise';
    }>;
    detectedLanguages: Array<{ languageCode: string; probability: number }>;
    languageSwitches: number;
    fillerWordsAnalysis: {
      totalFillerWords: number;
      fillerWordsRatio: number;
      commonFillers: Array<{
        word: string;
        count: number;
        timestamps: number[];
      }>;
      fillerWordsByLanguage: { [key: string]: number };
    };
  } {
    const currentLanguage = languageService.getCurrentLanguage();
    
    if (currentLanguage === 'kk') {
      const text = `Сабаққа қош келдіңіздер. Эм... бүгін біз жаңа тақырыпты зерттейміз. 
        Бұл пәнді түсіну үшін өте маңызды материал. Сегодня мы изучаем важную тему.
        Негізгі ұғымдар мен мысалдарды қарастырайық. Рассмотрим основные понятия.`;
      
      const words = this.generateWordsArrayWithFillers(text);
      const fillerWords = words.filter(w => w.isFillerWord);
      
      return {
        text,
        words,
        detectedLanguages: [
          { languageCode: 'kk-KZ', probability: 0.7 },
          { languageCode: 'ru-RU', probability: 0.3 }
        ],
        languageSwitches: 2,
        fillerWordsAnalysis: this.analyzeFillerWordsFromWords(fillerWords, words.length)
      };
    } else {
      const text = `Добро пожаловать на урок. Эм... сегодня мы изучаем новую тему. 
        Это очень важный материал для понимания предмета. This is important material.
        Давайте рассмотрим основные понятия и примеры. Let's examine the concepts.`;
      
      const words = this.generateWordsArrayWithFillers(text);
      const fillerWords = words.filter(w => w.isFillerWord);
      
      return {
        text,
        words,
        detectedLanguages: [
          { languageCode: 'ru-RU', probability: 0.8 },
          { languageCode: 'en-US', probability: 0.2 }
        ],
        languageSwitches: 2,
        fillerWordsAnalysis: this.analyzeFillerWordsFromWords(fillerWords, words.length)
      };
    }
  }

  private analyzeDetailedVocabularyWithFillers(
    transcription: string, 
    duration: number, 
    detectedLanguages: Array<{ languageCode: string; probability: number }>,
    fillerWordsAnalysis?: any,
    words?: Array<{ word: string; isFillerWord?: boolean; wordType?: string }>
  ): DetailedVocabularyAnalysis {
    const allWords = transcription.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    const uniqueWords = new Set(allWords);
    const wordCount = allWords.length;
    const uniqueWordCount = uniqueWords.size;
    const vocabularyRichness = uniqueWordCount / wordCount;
    
    const totalLength = allWords.reduce((sum, word) => sum + word.length, 0);
    const averageWordLength = totalLength / wordCount;
    
    const complexWords = allWords.filter(word => word.length > 6).length;
    
    const multilingualFillerWords = [
      'эм', 'эмм', 'ах', 'ну', 'так', 'значит', 'короче', 'типа', 'как бы', 'вот', 'это', 'ээ', 'мм',
      'әм', 'әмм', 'ах', 'міне', 'осылай', 'яғни', 'қысқасы', 'түрі', 'сияқты', 'міне', 'бұл', 'ээ', 'мм',
      'um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically'
    ];
    
    let fillerWords = 0;
    let fillerWordsRatio = 0;
    
    if (fillerWordsAnalysis) {
      fillerWords = fillerWordsAnalysis.totalFillerWords;
      fillerWordsRatio = fillerWordsAnalysis.fillerWordsRatio;
    } else {
      fillerWords = allWords.filter(word => multilingualFillerWords.includes(word)).length;
      fillerWordsRatio = fillerWords / wordCount;
    }
    
    const speakingRate = (wordCount / duration) * 60;
    
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const pauseAnalysis = {
      totalPauses: sentences.length - 1,
      averagePauseLength: 1.5,
      appropriatePauses: Math.floor(sentences.length * 0.8)
    };

    let languageMixing = undefined;
    if (detectedLanguages && detectedLanguages.length > 1) {
      const isMultilingual = detectedLanguages.length > 1;
      const dominantLanguage = detectedLanguages[0]?.languageCode || 'ru-RU';
      const languageDistribution: { [key: string]: number } = {};
      
      detectedLanguages.forEach(lang => {
        languageDistribution[lang.languageCode] = lang.probability;
      });

      const switchPoints = Math.floor(transcription.length / 100);
      
      languageMixing = {
        isMixed: isMultilingual,
        switchPoints,
        dominantLanguage,
        languageDistribution
      };
    }

    let enhancedFillerWordsAnalysis = undefined;
    if (fillerWordsAnalysis) {
      const fillerWordsInsights = [];
      
      if (fillerWordsAnalysis.fillerWordsRatio > 0.1) {
        fillerWordsInsights.push('Высокий процент слов-запинок (>10%)');
      }
      
      if (fillerWordsAnalysis.commonFillers.length > 0) {
        const topFillers = fillerWordsAnalysis.commonFillers.slice(0, 3).map((f: any) => f.word).join(', ');
        fillerWordsInsights.push(`Наиболее частые: ${topFillers}`);
      }
      
      if (Object.keys(fillerWordsAnalysis.fillerWordsByLanguage).length > 1) {
        fillerWordsInsights.push('Слова-запинки на разных языках');
      }
      
      enhancedFillerWordsAnalysis = {
        ...fillerWordsAnalysis,
        fillerWordsInsights
      };
    }
    
    let score = 0;
    
    if (vocabularyRichness >= 0.7) score += 40;
    else if (vocabularyRichness >= 0.6) score += 35;
    else if (vocabularyRichness >= 0.5) score += 30;
    else if (vocabularyRichness >= 0.4) score += 25;
    else score += vocabularyRichness * 50;
    
    const complexWordsRatio = complexWords / wordCount;
    if (complexWordsRatio >= 0.3) score += 40;
    else if (complexWordsRatio >= 0.2) score += 30;
    else if (complexWordsRatio >= 0.1) score += 20;
    else score += complexWordsRatio * 200;
    
    if (speakingRate >= 140 && speakingRate <= 160) score += 40;
    else if (speakingRate >= 120 && speakingRate <= 180) score += 35;
    else if (speakingRate >= 100 && speakingRate <= 200) score += 25;
    else score += 15;
    
    if (fillerWordsRatio <= 0.02) score += 40;
    else if (fillerWordsRatio <= 0.05) score += 30;
    else if (fillerWordsRatio <= 0.1) score += 20;
    else score += Math.max(0, 40 - (fillerWordsRatio * 400));
    
    const pauseQuality = pauseAnalysis.appropriatePauses / pauseAnalysis.totalPauses;
    score += pauseQuality * 40;
    
    const recommendations = this.generateMultilingualVocabularyRecommendationsWithFillers(
      vocabularyRichness, speakingRate, fillerWordsRatio, complexWordsRatio, languageMixing, enhancedFillerWordsAnalysis
    );
    
    return {
      score: Math.round(Math.min(200, Math.max(0, score))),
      maxScore: 200,
      wordCount,
      uniqueWords: uniqueWordCount,
      vocabularyRichness,
      averageWordLength,
      complexWords,
      fillerWords,
      fillerWordsRatio,
      speakingRate,
      pauseAnalysis,
      languageMixing,
      fillerWordsAnalysis: enhancedFillerWordsAnalysis,
      recommendations
    };
  }

  private analyzeDetailedTextClassification(
    transcription: string, 
    detectedLanguages: Array<{ languageCode: string; probability: number }>
  ): DetailedTextClassification {
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = transcription.toLowerCase().split(/\s+/);
    
    const hasIntroduction = this.detectMultilingualIntroduction(transcription);
    const hasConclusion = this.detectMultilingualConclusion(transcription);
    const hasExamples = this.detectMultilingualExamples(transcription);
    const logicalFlow = this.analyzeMultilingualLogicalFlow(sentences);
    
    const coherence = this.analyzeCoherence(sentences);
    const topics = this.identifyMultilingualTopics(words);
    
    const totalWords = words.length;
    const averageSentenceLength = totalWords / sentences.length;
    const sentenceComplexity = this.analyzeMultilingualSentenceComplexity(sentences);
    const sentenceVariety = this.analyzeSentenceVariety(sentences);
    
    const explanationQuality = this.analyzeMultilingualExplanationQuality(transcription);
    const conceptClarity = this.analyzeMultilingualConceptClarity(transcription);
    const exampleUsage = this.analyzeMultilingualExampleUsage(transcription);

    let multilingualAnalysis = undefined;
    if (detectedLanguages && detectedLanguages.length > 1) {
      const primaryLanguage = detectedLanguages[0]?.languageCode || 'ru-RU';
      const codeSwithingFrequency = this.calculateCodeSwitchingFrequency(transcription, detectedLanguages);
      
      multilingualAnalysis = {
        detectedLanguages: detectedLanguages.map(l => l.languageCode),
        primaryLanguage,
        codeSwithingFrequency
      };
    }
    
    let score = 0;
    
    if (hasIntroduction) score += 15;
    if (hasConclusion) score += 15;
    if (hasExamples) score += 10;
    score += logicalFlow * 10;
    
    score += coherence * 40;
    
    if (averageSentenceLength >= 8 && averageSentenceLength <= 15) score += 15;
    else score += Math.max(0, 15 - Math.abs(averageSentenceLength - 11.5) * 2);
    
    score += sentenceComplexity * 15;
    score += sentenceVariety * 10;
    
    score += explanationQuality * 25;
    score += conceptClarity * 25;
    score += exampleUsage * 20;
    
    const recommendations = this.generateMultilingualTextClassificationRecommendations(
      hasIntroduction, hasConclusion, hasExamples, coherence, explanationQuality, multilingualAnalysis
    );
    
    return {
      score: Math.round(Math.min(200, Math.max(0, score))),
      maxScore: 200,
      structure: {
        hasIntroduction,
        hasConclusion,
        hasExamples,
        logicalFlow
      },
      coherence,
      topics,
      sentenceAnalysis: {
        averageLength: averageSentenceLength,
        complexity: sentenceComplexity,
        variety: sentenceVariety
      },
      educationalContent: {
        explanationQuality,
        conceptClarity,
        exampleUsage
      },
      multilingualAnalysis,
      recommendations
    };
  }

  private detectMultilingualIntroduction(text: string): boolean {
    const introPatterns = [
      'добро пожаловать', 'сегодня', 'урок', 'изучаем', 'рассмотрим', 'начнем', 'приступим', 'здравствуйте', 'тема урока',
      'қош келдіңіздер', 'бүгін', 'сабақ', 'зерттейміз', 'қарастырайық', 'бастайық', 'кірісейік', 'сәлеметсіздер', 'сабақ тақырыбы',
      'welcome', 'today', 'lesson', 'study', 'examine', 'start', 'begin', 'hello', 'topic'
    ];
    
    const firstPart = text.substring(0, text.length / 4).toLowerCase();
    return introPatterns.some(pattern => firstPart.includes(pattern));
  }

  private detectMultilingualConclusion(text: string): boolean {
    const conclusionPatterns = [
      'заключение', 'итак', 'подведем итог', 'в заключение', 'таким образом', 'следовательно', 'домашнее задание', 'на следующем уроке', 'спасибо за внимание',
      'қорытынды', 'сонымен', 'қорытындылайық', 'қорытындыда', 'осылайша', 'демек', 'үй тапсырмасы', 'келесі сабақта', 'назарларыңызға рахмет',
      'conclusion', 'therefore', 'in summary', 'to conclude', 'thus', 'homework', 'next lesson', 'thank you'
    ];
    
    const lastPart = text.substring(text.length * 3/4).toLowerCase();
    return conclusionPatterns.some(pattern => lastPart.includes(pattern));
  }

  private detectMultilingualExamples(text: string): boolean {
    const examplePatterns = [
      'пример', 'рассмотрим', 'возьмем', 'допустим', 'предположим', 'например', 'к примеру', 'скажем', 'представим',
      'мысал', 'қарастырайық', 'алайық', 'делік', 'ойлап көрейік', 'мысалы', 'мысал ретінде', 'айтайық', 'елестетейік',
      'example', 'for instance', 'let\'s consider', 'suppose', 'imagine', 'such as'
    ];
    
    return examplePatterns.some(pattern => text.toLowerCase().includes(pattern));
  }

  private analyzeMultilingualLogicalFlow(sentences: string[]): number {
    const connectiveWords = [
      'поэтому', 'следовательно', 'таким образом', 'в результате', 'кроме того', 'более того', 'однако', 'но', 'а', 'также',
      'сондықтан', 'демек', 'осылайша', 'нәтижесінде', 'сонымен қатар', 'одан басқа', 'алайда', 'бірақ', 'ал', 'сондай-ақ',
      'therefore', 'thus', 'however', 'moreover', 'furthermore', 'nevertheless', 'also', 'additionally'
    ];
    
    let connectiveCount = 0;
    sentences.forEach(sentence => {
      if (connectiveWords.some(word => sentence.toLowerCase().includes(word))) {
        connectiveCount++;
      }
    });
    
    return Math.min(1, connectiveCount / (sentences.length * 0.3));
  }

  private identifyMultilingualTopics(words: string[]): string[] {
    const topicKeywords = {
      'Математика / Math': [
        'теңдеу', 'формула', 'шешім', 'сан', 'функция', 'график', 'түбір', 'дискриминант',
        'уравнение', 'формула', 'решение', 'число', 'функция', 'график', 'корень', 'дискриминант',
        'equation', 'formula', 'solution', 'number', 'function', 'graph', 'root'
      ],
      'Физика / Physics': [
        'күш', 'энергия', 'қозғалыс', 'жылдамдық', 'үдеу', 'заң', 'ньютон', 'масса',
        'сила', 'энергия', 'движение', 'скорость', 'ускорение', 'закон', 'ньютон', 'масса',
        'force', 'energy', 'motion', 'velocity', 'acceleration', 'law', 'newton', 'mass'
      ],
      'Тарих / History': [
        'соғыс', 'шайқас', 'жыл', 'ғасыр', 'оқиға', 'әскер', 'жеңіс', 'жеңіліс',
        'война', 'битва', 'год', 'век', 'событие', 'армия', 'победа', 'поражение',
        'war', 'battle', 'year', 'century', 'event', 'army', 'victory', 'defeat'
      ]
    };
    
    const topics: string[] = [];
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matchCount = keywords.filter(keyword => 
        words.some(word => word.includes(keyword.toLowerCase()))
      ).length;
      
      if (matchCount >= 2) {
        topics.push(topic);
      }
    });
    
    return topics.length > 0 ? topics : ['Жалпы білім / General Education'];
  }

  private analyzeMultilingualSentenceComplexity(sentences: string[]): number {
    let complexityScore = 0;
    
    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/).length;
      const commas = (sentence.match(/,/g) || []).length;
      
      const subordinateClauses = (sentence.match(/ол|оның|оны|не|үшін|егер|қашан|который|которая|которое|что|чтобы|если|когда|that|which|who|when|if/g) || []).length;
      
      let sentenceComplexity = 0;
      if (words > 10) sentenceComplexity += 0.3;
      if (commas > 1) sentenceComplexity += 0.3;
      if (subordinateClauses > 0) sentenceComplexity += 0.4;
      
      complexityScore += Math.min(1, sentenceComplexity);
    });
    
    return complexityScore / sentences.length;
  }

  private analyzeMultilingualExplanationQuality(text: string): number {
    const explanationWords = [
      'потому что', 'так как', 'поскольку', 'дело в том', 'объясняется', 'причина', 'следствие', 'означает',
      'себебі', 'өйткені', 'сондықтан', 'мәселе мынада', 'түсіндіріледі', 'себеп', 'салдар', 'білдіреді',
      'because', 'since', 'due to', 'the reason is', 'explains', 'means', 'therefore'
    ];
    
    let explanationCount = 0;
    explanationWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        explanationCount++;
      }
    });
    
    return Math.min(1, explanationCount / 3);
  }

  private analyzeMultilingualConceptClarity(text: string): number {
    const clarityWords = [
      'то есть', 'иными словами', 'другими словами', 'проще говоря', 'определение', 'понятие',
      'яғни', 'басқаша айтқанда', 'басқа сөзбен айтқанда', 'қарапайым тілмен айтқанда', 'анықтама', 'ұғым',
      'that is', 'in other words', 'simply put', 'definition', 'concept', 'means'
    ];
    
    let clarityCount = 0;
    clarityWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        clarityCount++;
      }
    });
    
    return Math.min(1, clarityCount / 2);
  }

  private analyzeMultilingualExampleUsage(text: string): number {
    const examplePattern = /мысал|мысалы|мысал ретінде|қарастырайық|алайық|пример|например|к примеру|рассмотрим|возьмем|example|for instance|let's consider/g;
    
    const exampleCount = (text.toLowerCase().match(examplePattern) || []).length;
    return Math.min(1, exampleCount / 3);
  }

  private calculateCodeSwitchingFrequency(text: string, detectedLanguages: Array<{ languageCode: string; probability: number }>): number {
    if (detectedLanguages.length <= 1) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let switches = 0;
    
    for (let i = 1; i < sentences.length; i++) {
      const prevSentence = sentences[i-1].toLowerCase();
      const currSentence = sentences[i].toLowerCase();
      
      const hasRussian = /[а-я]/.test(prevSentence) || /[а-я]/.test(currSentence);
      const hasKazakh = /[әіңғүұқөһ]/.test(prevSentence) || /[әіңғүұқөһ]/.test(currSentence);
      const hasEnglish = /[a-z]/.test(prevSentence) || /[a-z]/.test(currSentence);
      
      if ((hasRussian && hasKazakh) || (hasRussian && hasEnglish) || (hasKazakh && hasEnglish)) {
        switches++;
      }
    }
    
    return switches / sentences.length;
  }

  private analyzeCoherence(sentences: string[]): number {
    if (sentences.length < 2) return 0.5;
    
    let coherenceScore = 0;
    for (let i = 1; i < sentences.length; i++) {
      const prevWords = new Set(sentences[i-1].toLowerCase().split(/\s+/));
      const currWords = new Set(sentences[i].toLowerCase().split(/\s+/));
      
      const intersection = new Set([...prevWords].filter(x => currWords.has(x)));
      const union = new Set([...prevWords, ...currWords]);
      
      coherenceScore += intersection.size / union.size;
    }
    
    return coherenceScore / (sentences.length - 1);
  }

  private analyzeSentenceVariety(sentences: string[]): number {
    if (sentences.length < 3) return 0.5;
    
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    return Math.min(1, variance / 20);
  }

  private generateMultilingualVocabularyRecommendationsWithFillers(
    richness: number, 
    rate: number, 
    fillerRatio: number, 
    complexRatio: number,
    languageMixing?: any,
    fillerWordsAnalysis?: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (richness < 0.5) {
      recommendations.push("Расширяйте словарный запас / Сөздік қорыңызды кеңейтіңіз");
    }
    if (rate < 120) {
      recommendations.push("Увеличьте темп речи / Сөйлеу қарқынын арттырыңыз");
    }
    if (rate > 180) {
      recommendations.push("Замедлите темп речи / Сөйлеу қарқынын баяулатыңыз");
    }
    
    if (fillerRatio > 0.05) {
      recommendations.push("Сократите слова-запинки / Сөз-паразиттерді азайтыңыз");
    }
    
    if (fillerWordsAnalysis) {
      if (fillerWordsAnalysis.fillerWordsRatio > 0.1) {
        recommendations.push("Высокий процент слов-запинок - практикуйте плавную речь");
      }
      
      if (fillerWordsAnalysis.commonFillers.length > 0) {
        const topFiller = fillerWordsAnalysis.commonFillers[0].word;
        recommendations.push(`Чаще всего используете "${topFiller}" - замените паузами`);
      }
      
      if (Object.keys(fillerWordsAnalysis.fillerWordsByLanguage).length > 1) {
        recommendations.push("Слова-запинки на разных языках - работайте над языковой консистентностью");
      }
    }
    
    if (complexRatio < 0.15) {
      recommendations.push("Используйте более сложную лексику / Күрделірек лексика пайдаланыңыз");
    }
    
    if (languageMixing?.isMixed) {
      if (languageMixing.switchPoints > 5) {
        recommendations.push("Частые переключения языков могут затруднять понимание / Тілдерді жиі ауыстыру түсінуді қиындатуы мүмкін");
      }
      recommendations.push("Рассмотрите использование одного основного языка / Бір негізгі тілді пайдалануды қарастырыңыз");
    }
    
    return recommendations;
  }

  private generateMultilingualTextClassificationRecommendations(
    hasIntro: boolean,
    hasConclusion: boolean,
    hasExamples: boolean,
    coherence: number,
    explanationQuality: number,
    multilingualAnalysis?: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (!hasIntro) {
      recommendations.push("Добавьте четкое введение / Нақты кіріспе қосыңыз");
    }
    if (!hasConclusion) {
      recommendations.push("Завершайте урок подведением итогов / Сабақты қорытындымен аяқтаңыз");
    }
    if (!hasExamples) {
      recommendations.push("Используйте больше примеров / Көбірек мысалдарды пайдаланыңыз");
    }
    if (coherence < 0.6) {
      recommendations.push("Улучшите связность изложения / Баяндаудың байланыстылығын жақсартыңыз");
    }
    if (explanationQuality < 0.5) {
      recommendations.push("Добавьте больше объяснений / Көбірек түсіндірме қосыңыз");
    }
    
    if (multilingualAnalysis?.codeSwithingFrequency > 0.3) {
      recommendations.push("Высокая частота переключения языков может снижать эффективность обучения / Тілдерді жиі ауыстыру оқыту тиімділігін төмендетуі мүмкін");
    }
    
    return recommendations;
  }
}

export const audioAnalysisService = new AudioAnalysisService();