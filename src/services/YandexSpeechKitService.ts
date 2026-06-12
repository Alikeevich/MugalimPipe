export interface YandexSpeechKitConfig {
  // API ключи удалены из фронтенда для безопасности
  languages?: string[];
  autoDetectLanguage?: boolean;
  format?: 'lpcm' | 'oggopus' | 'mp3';
  sampleRateHertz?: number;
  includeFillerWords?: boolean;
  literatureText?: boolean;
  rawResults?: boolean;
}

export interface YandexSpeechKitV3Response {
  result: {
    alternatives: Array<{
      words: Array<{
        startTime: string;
        endTime: string;
        word: string;
        confidence: number;
      }>;
      text: string;
      confidence: number;
      languages?: Array<{
        languageCode: string;
        probability: number;
      }>;
    }>;
    channelTag: string;
    languageCode?: string;
  };
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
    isFillerWord?: boolean;
    wordType?: 'word' | 'filler' | 'pause' | 'noise';
  }>;
  duration: number;
  detectedLanguages?: Array<{
    languageCode: string;
    probability: number;
    text: string;
  }>;
  mixedLanguageSegments?: Array<{
    startTime: number;
    endTime: number;
    text: string;
    languageCode: string;
    confidence: number;
  }>;
  fillerWordsAnalysis?: {
    totalFillerWords: number;
    fillerWordsRatio: number;
    commonFillers: Array<{
      word: string;
      count: number;
      timestamps: number[];
    }>;
    fillerWordsByLanguage: { [key: string]: number };
  };
}

export interface LanguageDetectionResult {
  primaryLanguage: string;
  confidence: number;
  detectedLanguages: Array<{
    code: string;
    probability: number;
    segments: Array<{
      text: string;
      startTime: number;
      endTime: number;
    }>;
  }>;
  isMultilingual: boolean;
}

class YandexSpeechKitService {
  private config: YandexSpeechKitConfig;
  private netlifyFunctionUrl: string;

  constructor(config: YandexSpeechKitConfig) {
    this.config = {
      languages: ['ru-RU', 'kk-KZ', 'en-US'], // Default multilingual support
      autoDetectLanguage: true,
      format: 'lpcm',
      sampleRateHertz: 16000,
      includeFillerWords: true, // Включаем слова-запинки
      ...config
    };
    
    // URL Vercel Serverless Function для безопасной работы с Yandex API
    this.netlifyFunctionUrl = '/api/yandex-transcribe';
  }

  /**
   * Enhanced multilingual filler words dictionary for CIS region
   */
  private getFillerWordsDictionary(): { [key: string]: string[] } {
    return {
      'ru-RU': [
        // Классические междометия
        'эм', 'эмм', 'эммм', 'ээм', 'ээмм',
        'ах', 'ахх', 'аххх', 'ааа', 'ааах',
        'ну', 'нуу', 'нууу', 'н-ну', 'ну-у',
        'мм', 'ммм', 'мммм', 'хм', 'хмм',
        'ээ', 'ээээ', 'э-э', 'э-э-э',
        'ой', 'ойй', 'ойойой', 'ох', 'охх',
        'уф', 'уфф', 'уффф', 'фу', 'фуу',
        
        // Слова-паразиты
        'так', 'значит', 'короче', 'типа', 'как бы',
        'вот', 'это', 'ну это', 'в общем', 'в принципе',
        'собственно', 'кстати', 'между прочим',
        'понимаете', 'знаете', 'видите ли',
        'ну как сказать', 'как это', 'ну да',
        
        // Паузы и заполнители
        'тс', 'тсс', 'тссс', 'шш', 'шшш',
        'пф', 'пфф', 'пффф', 'бр', 'брр'
      ],
      'kk-KZ': [
        // Казахские междометия
        'әм', 'әмм', 'әммм', 'ээм', 'ээмм',
        'ах', 'ахх', 'аххх', 'ааа', 'ааах',
        'мм', 'ммм', 'мммм', 'хм', 'хмм',
        'ээ', 'ээээ', 'э-э', 'э-э-э',
        'ой', 'ойй', 'ох', 'охх',
        'уф', 'уфф', 'фу', 'фуу',
        
        // Казахские слова-паразиты
        'міне', 'осылай', 'яғни', 'қысқасы',
        'түрі', 'сияқты', 'дегенмен', 'сонда',
        'енді', 'ал', 'сонымен', 'демек',
        'түсінесіз бе', 'білесіз бе', 'көресіз бе',
        'қалай десек', 'не десек', 'ну осы',
        
        // Паузы
        'тс', 'тсс', 'шш', 'шшш',
        'пф', 'пфф', 'бр', 'брр'
      ],
      'en-US': [
        // English fillers
        'um', 'umm', 'ummm', 'uh', 'uhh',
        'er', 'err', 'errr', 'ah', 'ahh',
        'mm', 'mmm', 'mmmm', 'hm', 'hmm',
        'oh', 'ohh', 'ohhh', 'wow', 'woah',
        
        // English filler phrases
        'like', 'you know', 'I mean', 'sort of',
        'kind of', 'well', 'so', 'actually',
        'basically', 'literally', 'obviously',
        'you see', 'you understand', 'right',
        
        // Pauses
        'shh', 'shhh', 'tsk', 'pff', 'pfff'
      ]
    };
  }

  setLanguages(languages: string[]): void {
    this.config.languages = languages;
    console.log(`Yandex SpeechKit languages set to: ${languages.join(', ')}`);
  }

  setAutoDetectLanguage(enabled: boolean): void {
    this.config.autoDetectLanguage = enabled;
    console.log(`Yandex SpeechKit auto-detection: ${enabled ? 'enabled' : 'disabled'}`);
  }

  setIncludeFillerWords(enabled: boolean): void {
    this.config.includeFillerWords = enabled;
    this.config.literatureText = !enabled; // Отключаем литературную обработку при включении слов-запинок
    this.config.rawResults = enabled; // Включаем сырые результаты
    console.log(`Yandex SpeechKit filler words: ${enabled ? 'enabled' : 'disabled'}`);
  }

  getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string; region: string }> {
    return [
      { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', region: 'Russia' },
      { code: 'kk-KZ', name: 'Kazakh', nativeName: 'Қазақша', region: 'Kazakhstan' },
      { code: 'en-US', name: 'English', nativeName: 'English', region: 'United States' },
      { code: 'uz-UZ', name: 'Uzbek', nativeName: 'O\'zbek', region: 'Uzbekistan' },
      { code: 'ky-KG', name: 'Kyrgyz', nativeName: 'Кыргызча', region: 'Kyrgyzstan' },
      { code: 'tg-TJ', name: 'Tajik', nativeName: 'Тоҷикӣ', region: 'Tajikistan' },
      { code: 'az-AZ', name: 'Azerbaijani', nativeName: 'Azərbaycan', region: 'Azerbaijan' },
      { code: 'hy-AM', name: 'Armenian', nativeName: 'Հայերեն', region: 'Armenia' },
      { code: 'ka-GE', name: 'Georgian', nativeName: 'ქართული', region: 'Georgia' }
    ];
  }

  /**
   * Transcribes audio using secure Netlify Function (API keys protected on server)
   */
  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log(`Starting secure Yandex SpeechKit transcription via Netlify Function...`);
      
      // Конвертируем аудио в base64 для передачи в функцию
      const audioBase64 = await this.blobToBase64(audioBlob);
      
      // Отправляем запрос в безопасную Netlify Function
      const response = await fetch(this.netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'transcribe',
          audioData: audioBase64,
          config: this.config
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }
      
      return result.result;

    } catch (error) {
      console.error('Secure Yandex SpeechKit transcription failed:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Converts Blob to base64 for secure transmission to Netlify Function
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Убираем префикс data:audio/...;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Transcribes audio with intelligent chunking and enhanced filler words detection
   */
  async transcribeAudioChunked(audioBlob: Blob, onProgress?: (progress: number) => void): Promise<TranscriptionResult> {
    try {
      console.log('Starting secure chunked transcription via Netlify Function...');
      
      // Check if audio is small enough for direct processing
      if (audioBlob.size <= 1024 * 1024) { // 1MB
        return await this.transcribeAudio(audioBlob);
      }

      // Split audio into overlapping chunks for better language detection
      const chunks = await this.splitAudioIntoIntelligentChunks(audioBlob);
      
      let combinedResult: TranscriptionResult = {
        text: '',
        confidence: 0,
        words: [],
        duration: 0,
        detectedLanguages: [],
        mixedLanguageSegments: [],
        fillerWordsAnalysis: {
          totalFillerWords: 0,
          fillerWordsRatio: 0,
          commonFillers: [],
          fillerWordsByLanguage: {}
        }
      };

      const languageSegments: Array<{
        startTime: number;
        endTime: number;
        text: string;
        languageCode: string;
        confidence: number;
      }> = [];

      let totalConfidence = 0;
      let validChunks = 0;
      let allFillerWords: Array<{ word: string; timestamp: number; language: string }> = [];
      
      for (let i = 0; i < chunks.length; i++) {
        try {
          console.log(`Processing chunk ${i + 1}/${chunks.length} with enhanced filler detection...`);
          
          const chunkResult = await this.transcribeAudio(chunks[i]);
          
          if (chunkResult.text.trim()) {
            const chunkOffset = i * 30; // 30-second chunks
            
            // Detect primary language for this chunk
            const detectedLanguage = await this.detectChunkLanguage(chunkResult.text);
            
            // Adjust word timestamps for chunk offset and analyze filler words
            const adjustedWords = chunkResult.words.map(word => {
              const adjustedWord = {
                ...word,
                startTime: word.startTime + chunkOffset,
                endTime: word.endTime + chunkOffset
              };
              
              // Check if word is a filler word
              const fillerInfo = this.analyzeWordForFiller(word.word, detectedLanguage.code);
              if (fillerInfo.isFiller) {
                adjustedWord.isFillerWord = true;
                adjustedWord.wordType = fillerInfo.type;
                allFillerWords.push({
                  word: word.word,
                  timestamp: adjustedWord.startTime,
                  language: detectedLanguage.code
                });
              }
              
              return adjustedWord;
            });

            // Add language segment
            languageSegments.push({
              startTime: chunkOffset,
              endTime: chunkOffset + 30,
              text: chunkResult.text,
              languageCode: detectedLanguage.code,
              confidence: chunkResult.confidence
            });

            // Combine results
            combinedResult.text += (combinedResult.text ? ' ' : '') + chunkResult.text;
            combinedResult.words.push(...adjustedWords);
            totalConfidence += chunkResult.confidence;
            validChunks++;
          }
          
          if (onProgress) {
            onProgress((i + 1) / chunks.length * 100);
          }
          
          // Small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.warn(`Failed to transcribe chunk ${i + 1}:`, error);
        }
      }

      // Analyze language distribution
      const languageAnalysis = this.analyzeLanguageDistribution(languageSegments);
      
      // Analyze filler words
      const fillerWordsAnalysis = this.analyzeFillerWords(allFillerWords, combinedResult.words.length);
      
      combinedResult.confidence = validChunks > 0 ? totalConfidence / validChunks : 0;
      combinedResult.duration = chunks.length * 30;
      combinedResult.detectedLanguages = languageAnalysis.languages;
      combinedResult.mixedLanguageSegments = languageSegments;
      combinedResult.fillerWordsAnalysis = fillerWordsAnalysis;
      
      console.log('🌍 Enhanced multilingual analysis with filler words complete:', {
        primaryLanguage: languageAnalysis.primaryLanguage,
        isMultilingual: languageAnalysis.isMultilingual,
        languageCount: languageAnalysis.languages.length,
        fillerWordsCount: fillerWordsAnalysis.totalFillerWords,
        fillerWordsRatio: fillerWordsAnalysis.fillerWordsRatio
      });
      
      return combinedResult;
      
    } catch (error) {
      console.error('Enhanced chunked transcription failed:', error);
      throw error;
    }
  }

  /**
   * Analyzes if a word is a filler word and determines its type
   */
  private analyzeWordForFiller(word: string, languageCode: string): {
    isFiller: boolean;
    type: 'word' | 'filler' | 'pause' | 'noise';
    confidence: number;
  } {
    const fillerDict = this.getFillerWordsDictionary();
    const normalizedWord = word.toLowerCase().trim();
    
    // Get filler words for detected language and fallback languages
    const languageFillers = fillerDict[languageCode] || [];
    const russianFillers = fillerDict['ru-RU'] || [];
    const allFillers = [...new Set([...languageFillers, ...russianFillers])];
    
    // Direct match
    if (allFillers.includes(normalizedWord)) {
      return {
        isFiller: true,
        type: this.categorizeFillerWord(normalizedWord),
        confidence: 0.9
      };
    }
    
    // Partial match for elongated sounds (эммм, аааа, etc.)
    const elongatedPattern = /^([аэоуыиеёюя]{1,2})\1+$/i;
    if (elongatedPattern.test(normalizedWord)) {
      return {
        isFiller: true,
        type: 'filler',
        confidence: 0.8
      };
    }
    
    // Check for repeated consonants (мммм, хммм, etc.)
    const consonantPattern = /^([мнхтсшщ])\1+$/i;
    if (consonantPattern.test(normalizedWord)) {
      return {
        isFiller: true,
        type: 'pause',
        confidence: 0.7
      };
    }
    
    // Check for noise patterns
    const noisePattern = /^[пфтсшщ]+$/i;
    if (noisePattern.test(normalizedWord) && normalizedWord.length <= 4) {
      return {
        isFiller: true,
        type: 'noise',
        confidence: 0.6
      };
    }
    
    return {
      isFiller: false,
      type: 'word',
      confidence: 0
    };
  }

  /**
   * Categorizes filler word type
   */
  private categorizeFillerWord(word: string): 'filler' | 'pause' | 'noise' {
    const pauseWords = ['мм', 'ммм', 'хм', 'хмм', 'тс', 'тсс', 'шш', 'шшш'];
    const noiseWords = ['пф', 'пфф', 'бр', 'брр', 'фу', 'фуу'];
    
    if (pauseWords.some(p => word.includes(p))) return 'pause';
    if (noiseWords.some(n => word.includes(n))) return 'noise';
    return 'filler';
  }

  /**
   * Analyzes filler words statistics
   */
  private analyzeFillerWords(
    fillerWords: Array<{ word: string; timestamp: number; language: string }>,
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
    const fillerWordsByLanguage: { [key: string]: number } = {};
    const fillerCounts: { [key: string]: { count: number; timestamps: number[] } } = {};
    
    fillerWords.forEach(filler => {
      // Count by language
      if (!fillerWordsByLanguage[filler.language]) {
        fillerWordsByLanguage[filler.language] = 0;
      }
      fillerWordsByLanguage[filler.language]++;
      
      // Count by word
      if (!fillerCounts[filler.word]) {
        fillerCounts[filler.word] = { count: 0, timestamps: [] };
      }
      fillerCounts[filler.word].count++;
      fillerCounts[filler.word].timestamps.push(filler.timestamp);
    });
    
    // Get most common fillers
    const commonFillers = Object.entries(fillerCounts)
      .map(([word, data]) => ({
        word,
        count: data.count,
        timestamps: data.timestamps
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most common
    
    return {
      totalFillerWords: fillerWords.length,
      fillerWordsRatio: totalWords > 0 ? fillerWords.length / totalWords : 0,
      commonFillers,
      fillerWordsByLanguage
    };
  }

  /**
   * Detects language of a text chunk using linguistic patterns
   */
  private async detectChunkLanguage(text: string): Promise<{ code: string; confidence: number }> {
    // Linguistic patterns for CIS languages
    const languagePatterns = {
      'ru-RU': {
        patterns: [/[ёъыэ]/gi, /\b(что|как|где|когда|почему|который|этот|тот)\b/gi, /[а-я]+(ся|сь)$/gi],
        commonWords: ['и', 'в', 'на', 'с', 'по', 'для', 'от', 'до', 'при', 'что', 'как', 'где', 'когда']
      },
      'kk-KZ': {
        patterns: [/[әіңғүұқөһ]/gi, /\b(не|қалай|қайда|қашан|неге|қай|осы|сол)\b/gi, /[а-я]+(ды|ді|ты|ті|ған|ген|қан|кен)$/gi],
        commonWords: ['және', 'бен', 'мен', 'үшін', 'дейін', 'кейін', 'не', 'қалай', 'қайда', 'қашан']
      },
      'en-US': {
        patterns: [/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi, /[a-z]+ing$/gi, /[a-z]+ed$/gi],
        commonWords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
      }
    };

    let bestMatch = { code: 'ru-RU', confidence: 0 };

    for (const [langCode, config] of Object.entries(languagePatterns)) {
      let score = 0;
      
      // Check patterns
      config.patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length * 2;
        }
      });

      // Check common words
      config.commonWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * 3;
        }
      });

      const confidence = Math.min(1, score / text.split(' ').length);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { code: langCode, confidence };
      }
    }

    return bestMatch;
  }

  /**
   * Analyzes language distribution across segments
   */
  private analyzeLanguageDistribution(segments: Array<{
    startTime: number;
    endTime: number;
    text: string;
    languageCode: string;
    confidence: number;
  }>): {
    primaryLanguage: string;
    isMultilingual: boolean;
    languages: Array<{
      languageCode: string;
      probability: number;
      text: string;
    }>;
  } {
    const languageStats: { [key: string]: { count: number; text: string; totalConfidence: number } } = {};
    
    segments.forEach(segment => {
      if (!languageStats[segment.languageCode]) {
        languageStats[segment.languageCode] = { count: 0, text: '', totalConfidence: 0 };
      }
      
      languageStats[segment.languageCode].count++;
      languageStats[segment.languageCode].text += ' ' + segment.text;
      languageStats[segment.languageCode].totalConfidence += segment.confidence;
    });

    const languages = Object.entries(languageStats).map(([code, stats]) => ({
      languageCode: code,
      probability: stats.count / segments.length,
      text: stats.text.trim()
    })).sort((a, b) => b.probability - a.probability);

    const primaryLanguage = languages[0]?.languageCode || 'ru-RU';
    const isMultilingual = languages.length > 1 && languages[1].probability > 0.15; // 15% threshold

    return {
      primaryLanguage,
      isMultilingual,
      languages
    };
  }

  /**
   * Splits audio into intelligent chunks with overlap for better language detection
   */
  private async splitAudioIntoIntelligentChunks(audioBlob: Blob): Promise<Blob[]> {
    // This is a simplified implementation
    // In a real application, you'd want to use proper audio processing with silence detection
    const chunkSize = Math.floor(audioBlob.size / Math.ceil(audioBlob.size / (1024 * 1024))); // Approximate 1MB chunks
    const chunks: Blob[] = [];
    
    for (let start = 0; start < audioBlob.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, audioBlob.size);
      const chunk = audioBlob.slice(start, end);
      chunks.push(chunk);
    }
    
    return chunks;
  }

  /**
   * Handles API errors with multilingual messages
   */
  private handleApiError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'object' && error !== null) {
      if (error.response) {
        const status = error.response.status;

        switch (status) {
          case 401:
            return new Error('Неверный API ключ. Проверьте правильность ключа. / API кілті дұрыс емес.');
          case 403:
            return new Error('Доступ запрещен. Проверьте права доступа и Folder ID. / Қол жетімділік тыйым салынған.');
          case 429:
            return new Error('Превышен лимит запросов. Попробуйте позже. / Сұраныстар шегі асып кетті.');
          case 413:
            return new Error('Файл слишком большой. Максимальный размер: 1ГБ. / Файл тым үлкен.');
          default:
            return new Error(`API ошибка: ${status}`);
        }
      } else if (error.request) {
        return new Error('Ошибка сети: Не удается подключиться к Yandex SpeechKit API / Желі қатесі');
      }
    }

    return new Error(`Ошибка транскрипции: ${error}`);
  }

  /**
   * Tests the connection to Yandex SpeechKit via secure Netlify Function
   */
  async testConnection(): Promise<{ success: boolean; message: string; detectedFeatures?: string[] }> {
    try {
      console.log('Testing secure Yandex SpeechKit connection via Netlify Function...');
      
      // Отправляем тестовый запрос в безопасную Netlify Function
      const response = await fetch(this.netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-connection'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        message: `Secure connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<YandexSpeechKitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Secure Yandex SpeechKit configuration updated:', {
      languages: this.config.languages,
      autoDetect: this.config.autoDetectLanguage,
      fillerWords: this.config.includeFillerWords
    });
  }

  /**
   * Gets current configuration (API keys now safely stored on server)
   */
  getConfig(): YandexSpeechKitConfig {
    return { ...this.config };
  }

  /**
   * Gets service status and configuration info
   */
  getStatus(): {
    configured: boolean;
    languages: string[];
    autoDetectLanguage: boolean;
    includeFillerWords: boolean;
    format: string;
    sampleRate: number;
    version: string;
  } {
    return {
      configured: true, // Всегда true, так как ключи на сервере
      languages: this.config.languages || [],
      autoDetectLanguage: this.config.autoDetectLanguage || false,
      includeFillerWords: this.config.includeFillerWords || false,
      format: this.config.format!,
      sampleRate: this.config.sampleRateHertz!,
      version: 'v3'
    };
  }

  /**
   * Analyzes transcription for language mixing patterns with enhanced filler words analysis
   */
  analyzeLanguageMixing(result: TranscriptionResult): {
    isMixed: boolean;
    switchPoints: number;
    dominantLanguage: string;
    languageDistribution: { [key: string]: number };
    recommendations: string[];
    fillerWordsInsights: {
      totalFillers: number;
      fillerRatio: number;
      mostCommonFillers: string[];
      fillersByLanguage: { [key: string]: number };
    };
  } {
    if (!result.mixedLanguageSegments || result.mixedLanguageSegments.length === 0) {
      return {
        isMixed: false,
        switchPoints: 0,
        dominantLanguage: 'ru-RU',
        languageDistribution: { 'ru-RU': 1.0 },
        recommendations: [],
        fillerWordsInsights: {
          totalFillers: result.fillerWordsAnalysis?.totalFillerWords || 0,
          fillerRatio: result.fillerWordsAnalysis?.fillerWordsRatio || 0,
          mostCommonFillers: result.fillerWordsAnalysis?.commonFillers.slice(0, 5).map(f => f.word) || [],
          fillersByLanguage: result.fillerWordsAnalysis?.fillerWordsByLanguage || {}
        }
      };
    }

    const segments = result.mixedLanguageSegments;
    const languageDistribution: { [key: string]: number } = {};
    let switchPoints = 0;
    let lastLanguage = '';

    segments.forEach(segment => {
      if (!languageDistribution[segment.languageCode]) {
        languageDistribution[segment.languageCode] = 0;
      }
      languageDistribution[segment.languageCode] += segment.endTime - segment.startTime;

      if (lastLanguage && lastLanguage !== segment.languageCode) {
        switchPoints++;
      }
      lastLanguage = segment.languageCode;
    });

    // Normalize distribution
    const totalDuration = result.duration;
    Object.keys(languageDistribution).forEach(lang => {
      languageDistribution[lang] /= totalDuration;
    });

    const dominantLanguage = Object.entries(languageDistribution)
      .sort(([,a], [,b]) => b - a)[0][0];

    const isMixed = Object.keys(languageDistribution).length > 1;

    const recommendations = [];
    if (isMixed) {
      recommendations.push('Обнаружено смешение языков в речи');
      recommendations.push('Рекомендуется использовать один основной язык для лучшего понимания');
      if (switchPoints > 10) {
        recommendations.push('Частые переключения между языками могут затруднять восприятие');
      }
    }

    // Enhanced filler words analysis
    const fillerWordsInsights = {
      totalFillers: result.fillerWordsAnalysis?.totalFillerWords || 0,
      fillerRatio: result.fillerWordsAnalysis?.fillerWordsRatio || 0,
      mostCommonFillers: result.fillerWordsAnalysis?.commonFillers.slice(0, 5).map(f => f.word) || [],
      fillersByLanguage: result.fillerWordsAnalysis?.fillerWordsByLanguage || {}
    };

    // Add filler words recommendations
    if (fillerWordsInsights.fillerRatio > 0.1) {
      recommendations.push('Высокий процент слов-запинок в речи (>10%)');
      recommendations.push('Рекомендуется работать над плавностью речи');
    }

    if (fillerWordsInsights.mostCommonFillers.length > 0) {
      recommendations.push(`Наиболее частые слова-запинки: ${fillerWordsInsights.mostCommonFillers.join(', ')}`);
    }

    return {
      isMixed,
      switchPoints,
      dominantLanguage,
      languageDistribution,
      recommendations,
      fillerWordsInsights
    };
  }
}

export { YandexSpeechKitService };