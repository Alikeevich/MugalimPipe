import axios from 'axios';

export interface YandexSpeechKitConfig {
  apiKey: string;
  folderId: string;
  apiUrl?: string;
  languages?: string[];
  autoDetectLanguage?: boolean;
  format?: 'lpcm' | 'oggopus' | 'mp3';
  sampleRateHertz?: number;
  profanityFilter?: boolean;
  literatureText?: boolean;
  includeFillerWords?: boolean;
  rawResults?: boolean;
  partialResults?: boolean;
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

  constructor(config: YandexSpeechKitConfig) {
    this.config = {
      apiUrl: 'https://stt.api.cloud.yandex.net/speech/v1/stt:longRunningRecognize',
      languages: ['ru-RU', 'kk-KZ', 'en-US'], // Default multilingual support
      autoDetectLanguage: true,
      format: 'lpcm',
      sampleRateHertz: 16000,
      profanityFilter: false, // Отключаем фильтр для сохранения всех слов
      literatureText: false, // Отключаем литературную обработку
      includeFillerWords: true, // Включаем слова-запинки
      rawResults: true, // Включаем сырые результаты
      partialResults: true, // Включаем частичные результаты
      ...config
    };
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

  /**
   * Sets languages for multilingual recognition
   */
  setLanguages(languages: string[]): void {
    this.config.languages = languages;
    console.log(`Yandex SpeechKit languages set to: ${languages.join(', ')}`);
  }

  /**
   * Enables or disables automatic language detection
   */
  setAutoDetectLanguage(enabled: boolean): void {
    this.config.autoDetectLanguage = enabled;
    console.log(`Yandex SpeechKit auto-detection: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enables or disables filler words transcription
   */
  setIncludeFillerWords(enabled: boolean): void {
    this.config.includeFillerWords = enabled;
    this.config.literatureText = !enabled; // Отключаем литературную обработку при включении слов-запинок
    this.config.rawResults = enabled; // Включаем сырые результаты
    console.log(`Yandex SpeechKit filler words: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Gets supported languages for CIS region
   */
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
   * Transcribes audio using Yandex SpeechKit v3 with enhanced filler words support
   */
  async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log(`Starting Yandex SpeechKit v3 transcription with filler words support...`);
      
      // For shorter audio (< 1 minute), use synchronous API
      if (await this.getAudioDuration(audioBlob) < 60) {
        return await this.transcribeShortAudio(audioBlob);
      } else {
        return await this.transcribeLongAudio(audioBlob);
      }

    } catch (error) {
      console.error('Yandex SpeechKit v3 transcription failed:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Transcribes short audio using synchronous API with enhanced configuration
   */
  private async transcribeShortAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    const audioBuffer = await audioBlob.arrayBuffer();
    
    const headers = {
      'Authorization': `Api-Key ${this.config.apiKey}`,
      'x-folder-id': this.config.folderId,
      'Content-Type': 'application/octet-stream'
    };

    // Enhanced recognition config for filler words
    const recognitionConfig = {
      format: this.config.format,
      sampleRateHertz: this.config.sampleRateHertz,
      profanityFilter: this.config.profanityFilter, // false для сохранения всех слов
      literature_text: this.config.literatureText, // false для сырого текста
      raw_results: this.config.rawResults, // true для получения всех результатов
      partial_results: this.config.partialResults, // true для частичных результатов
      audio_encoding: this.config.format?.toUpperCase(),
      
      // Специальные настройки для слов-запинок
      enable_automatic_punctuation: false, // Отключаем автопунктуацию
      enable_speaker_labeling: false, // Отключаем разметку спикеров для простоты
      enable_word_time_offsets: true, // Включаем временные метки для слов
      
      // Multilingual configuration
      ...(this.config.autoDetectLanguage ? {
        languageRestriction: this.config.languages,
        autoDetectLanguage: true
      } : {
        lang: this.config.languages?.[0] || 'ru-RU'
      })
    };

    const params = new URLSearchParams(recognitionConfig as any);
    const url = `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?${params.toString()}`;

    console.log('Sending enhanced request to Yandex SpeechKit v3:', {
      url,
      audioSize: audioBuffer.byteLength,
      config: recognitionConfig,
      fillerWordsEnabled: this.config.includeFillerWords
    });

    const response = await axios.post<YandexSpeechKitV3Response>(
      url,
      audioBuffer,
      {
        headers,
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      }
    );

    return this.processV3ResponseWithFillerWords(response.data);
  }

  /**
   * Transcribes long audio using asynchronous API with multilingual support
   */
  private async transcribeLongAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    console.log('Using long-running recognition for audio > 1 minute...');
    
    // Step 1: Upload audio to Yandex Object Storage (simplified - in real app you'd need storage)
    // For now, we'll chunk the audio and process in segments
    return await this.transcribeAudioChunked(audioBlob);
  }

  /**
   * Transcribes audio with intelligent chunking and enhanced filler words detection
   */
  async transcribeAudioChunked(audioBlob: Blob, onProgress?: (progress: number) => void): Promise<TranscriptionResult> {
    try {
      console.log('Starting intelligent chunked transcription with filler words...');
      
      // Check if audio is small enough for direct processing
      if (audioBlob.size <= 1024 * 1024) { // 1MB
        return await this.transcribeShortAudio(audioBlob);
      }

      // Split audio into overlapping chunks for better language detection
      const chunks = await this.splitAudioIntoIntelligentChunks(audioBlob, 30); // 30-second chunks
      
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
          
          const chunkResult = await this.transcribeShortAudio(chunks[i]);
          
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
  private async splitAudioIntoIntelligentChunks(audioBlob: Blob, chunkDurationSeconds: number): Promise<Blob[]> {
    // This is a simplified implementation
    // In a real application, you'd want to use proper audio processing with silence detection
    const overlapSeconds = 2; // 2-second overlap between chunks
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
   * Estimates audio duration from blob
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 60); // Default to 60s if can't determine
      };
      audio.onerror = () => {
        resolve(60); // Default to 60s on error
      };
      audio.src = URL.createObjectURL(audioBlob);
    });
  }

  /**
   * Processes the Yandex SpeechKit v3 API response with enhanced filler words detection
   */
  private processV3ResponseWithFillerWords(response: YandexSpeechKitV3Response): TranscriptionResult {
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
    
    // Process words with timing information and filler word detection
    const words = bestAlternative.words?.map(word => {
      const processedWord = {
        word: word.word,
        startTime: this.parseTimeString(word.startTime),
        endTime: this.parseTimeString(word.endTime),
        confidence: word.confidence,
        isFillerWord: false,
        wordType: 'word' as 'word' | 'filler' | 'pause' | 'noise'
      };

      // Analyze for filler words
      const languageCode = response.result.languageCode || 'ru-RU';
      const fillerInfo = this.analyzeWordForFiller(word.word, languageCode);
      
      if (fillerInfo.isFiller) {
        processedWord.isFillerWord = true;
        processedWord.wordType = fillerInfo.type;
      }

      return processedWord;
    }) || [];

    // Calculate duration from words
    const duration = words.length > 0 
      ? Math.max(...words.map(w => w.endTime))
      : 0;

    // Process detected languages if available
    const detectedLanguages = bestAlternative.languages?.map(lang => ({
      languageCode: lang.languageCode,
      probability: lang.probability,
      text: bestAlternative.text
    })) || [];

    // Analyze filler words
    const fillerWords = words
      .filter(w => w.isFillerWord)
      .map(w => ({
        word: w.word,
        timestamp: w.startTime,
        language: response.result.languageCode || 'ru-RU'
      }));

    const fillerWordsAnalysis = this.analyzeFillerWords(fillerWords, words.length);

    return {
      text: bestAlternative.text,
      confidence: bestAlternative.confidence,
      words,
      duration,
      detectedLanguages,
      fillerWordsAnalysis
    };
  }

  /**
   * Parses time string from Yandex format to seconds
   */
  private parseTimeString(timeStr: string): number {
    if (!timeStr) return 0;
    
    // Yandex returns time in format like "1.234s"
    const match = timeStr.match(/^(\d+(?:\.\d+)?)s?$/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Handles API errors with multilingual messages
   */
  private handleApiError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
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
            return new Error(`API ошибка: ${status} - ${JSON.stringify(data)}`);
        }
      } else if (error.request) {
        return new Error('Ошибка сети: Не удается подключиться к Yandex SpeechKit API / Желі қатесі');
      }
    }
    
    return new Error(`Ошибка транскрипции: ${error}`);
  }

  /**
   * Validates the configuration for v3 API
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('API ключ обязателен / API кілті міндетті');
    }

    if (!this.config.folderId) {
      errors.push('Folder ID обязателен / Folder ID міндетті');
    }

    if (this.config.apiKey && this.config.apiKey.length < 20) {
      errors.push('API ключ кажется неверным (слишком короткий) / API кілті дұрыс емес сияқты');
    }

    if (this.config.folderId && !this.config.folderId.match(/^[a-z0-9]{20}$/)) {
      errors.push('Folder ID должен содержать 20 символов / Folder ID 20 таңбадан тұруы керек');
    }

    if (this.config.languages && this.config.languages.length === 0) {
      errors.push('Необходимо указать хотя бы один язык / Кемінде бір тіл көрсету керек');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Tests the connection to Yandex SpeechKit v3 with enhanced filler words support
   */
  async testConnection(): Promise<{ success: boolean; message: string; detectedFeatures?: string[] }> {
    try {
      const validation = this.validateConfig();
      if (!validation.isValid) {
        return {
          success: false,
          message: `Ошибки конфигурации: ${validation.errors.join(', ')}`
        };
      }

      // Create a test audio with filler words (1 second of silence)
      const testBlob = this.createTestAudio();

      console.log('Testing v3 API with enhanced filler words configuration...');
      const result = await this.transcribeShortAudio(testBlob);
      
      const features = [];
      if (this.config.autoDetectLanguage) features.push('Автоопределение языка');
      if (this.config.languages && this.config.languages.length > 1) features.push('Многоязычность');
      if (this.config.includeFillerWords) features.push('Слова-запинки');
      if (this.config.rawResults) features.push('Сырые результаты');
      features.push('v3 API');
      
      return {
        success: true,
        message: 'Успешно подключено к Yandex SpeechKit v3 с поддержкой слов-запинок! / Yandex SpeechKit v3-ке сәтті қосылды!',
        detectedFeatures: features
      };
      
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        message: `Тест подключения не удался: ${error} / Қосылым тесті сәтсіз аяқталды`
      };
    }
  }

  /**
   * Creates a test audio blob for connection testing
   */
  private createTestAudio(): Blob {
    const sampleRate = 16000;
    const duration = 1; // 1 second
    const samples = sampleRate * duration;
    
    // Create WAV header + silence
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Updates the configuration
   */
  updateConfig(newConfig: Partial<YandexSpeechKitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Yandex SpeechKit v3 configuration updated:', {
      languages: this.config.languages,
      autoDetect: this.config.autoDetectLanguage,
      fillerWords: this.config.includeFillerWords,
      rawResults: this.config.rawResults
    });
  }

  /**
   * Gets current configuration (without sensitive data)
   */
  getConfig(): Omit<YandexSpeechKitConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Gets service status and configuration info
   */
  getStatus(): {
    configured: boolean;
    folderId: string;
    languages: string[];
    autoDetectLanguage: boolean;
    includeFillerWords: boolean;
    format: string;
    sampleRate: number;
    version: string;
  } {
    return {
      configured: !!(this.config.apiKey && this.config.folderId),
      folderId: this.config.folderId,
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