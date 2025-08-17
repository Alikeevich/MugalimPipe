import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiAnalysisRequest {
  transcription: string;
  videoAnalysis: any;
  audioAnalysis: any;
  scoringResults: any;
  multilingualData?: any;
  userLanguage: 'ru' | 'kk';
}

export interface GeminiReportResponse {
  professionalReport: {
    executiveSummary: string;
    detailedAnalysis: {
      strengths: string[];
      areasForImprovement: string[];
      keyInsights: string[];
    };
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
    actionPlan: {
      week1: string[];
      week2: string[];
      week3: string[];
      week4: string[];
    };
    multilingualInsights?: {
      languageUsage: string;
      codeSwithingAnalysis: string;
      recommendations: string[];
    };
  };
  enhancedRecommendations: {
    posture: string[];
    gesticulation: string[];
    facial: string[];
    speech: string[];
    engagement: string[];
    multilingual?: string[];
  };
  motivationalMessage: string;
  nextSteps: string[];
}

class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generates a comprehensive professional report using Gemini AI
   */
  async generateProfessionalReport(analysisData: GeminiAnalysisRequest): Promise<GeminiReportResponse> {
    try {
      console.log('🤖 Starting Gemini AI analysis for professional report...');
      
      const prompt = this.buildComprehensivePrompt(analysisData);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Gemini AI analysis completed');
      
      // Parse the structured response
      return this.parseGeminiResponse(text, analysisData.userLanguage);
      
    } catch (error) {
      console.error('❌ Gemini AI analysis failed:', error);
      
      // Return fallback response
      return this.generateFallbackReport(analysisData);
    }
  }

  /**
   * Builds a comprehensive prompt for Gemini AI analysis
   */
  private buildComprehensivePrompt(data: GeminiAnalysisRequest): string {
    const isKazakh = data.userLanguage === 'kk';
    
    const basePrompt = isKazakh ? `
Сіз педагогикалық дағдыларды талдайтын жетекші сарапшысыз. Мұғалімнің сабағын толық талдап, кәсіби есеп жасаңыз.

ТАЛДАУ ДЕРЕКТЕРІ:
` : `
Вы ведущий эксперт по анализу педагогических навыков. Проанализируйте урок учителя и создайте профессиональный отчет.

ДАННЫЕ АНАЛИЗА:
`;

    const dataSection = `
ТРАНСКРИПЦИЯ РЕЧИ:
${data.transcription}

ВИДЕО АНАЛИЗ:
- Поза и осанка: ${data.scoringResults.metrics.posture.score}/200 баллов
- Жестикуляция: ${data.scoringResults.metrics.gesticulation.score}/200 баллов  
- Мимика: ${data.scoringResults.metrics.facial.score}/200 баллов

АУДИО АНАЛИЗ:
- Речь: ${data.scoringResults.metrics.speech.score}/200 баллов
- Вовлеченность: ${data.scoringResults.metrics.engagement.score}/200 баллов
- Словарный запас: ${data.audioAnalysis.vocabulary.wordCount} слов
- Темп речи: ${data.audioAnalysis.vocabulary.speakingRate} слов/мин
- Слова-паразиты: ${data.audioAnalysis.vocabulary.fillerWords}

ОБЩИЙ РЕЗУЛЬТАТ: ${data.scoringResults.totalScore}/1000 баллов (${data.scoringResults.percentage.toFixed(1)}%)
`;

    const multilingualSection = data.multilingualData ? `
МНОГОЯЗЫЧНЫЙ АНАЛИЗ:
- Обнаружено языков: ${data.multilingualData.detectedLanguages?.length || 1}
- Переключения языков: ${data.multilingualData.languageSwitches || 0}
- Основной язык: ${data.multilingualData.dominantLanguage || 'ru-RU'}
- Смешанная речь: ${data.multilingualData.isMultilingual ? 'Да' : 'Нет'}
` : '';

    const instructionsPrompt = isKazakh ? `
НҰСҚАУЛЫҚ:
Келесі форматта толық кәсіби есеп жасаңыз:

1. АТҚАРУШЫ ҚОРЫТЫНДЫ (2-3 сөйлем)
2. ТОЛЫҚ ТАЛДАУ:
   - Күшті жақтары (3-5 нүкте)
   - Жақсарту салалары (3-5 нүкте)  
   - Негізгі түсініктер (3-4 нүкте)
3. ҰСЫНЫСТАР:
   - Дереу орындалатын (2-3 нүкте)
   - Қысқа мерзімді (3-4 нүкте)
   - Ұзақ мерзімді (2-3 нүкте)
4. ІС-ҚИМЫЛ ЖОСПАРЫ (4 апта)
5. КӨТЕРУ ХАБАРЛАМАСЫ
6. КЕЛЕСІ ҚАДАМДАР

Жауапты JSON форматында беріңіз.
` : `
ИНСТРУКЦИЯ:
Создайте полный профессиональный отчет в следующем формате:

1. РЕЗЮМЕ (2-3 предложения)
2. ДЕТАЛЬНЫЙ АНАЛИЗ:
   - Сильные стороны (3-5 пунктов)
   - Области для улучшения (3-5 пунктов)
   - Ключевые инсайты (3-4 пункта)
3. РЕКОМЕНДАЦИИ:
   - Немедленные (2-3 пункта)
   - Краткосрочные (3-4 пункта)
   - Долгосрочные (2-3 пункта)
4. ПЛАН ДЕЙСТВИЙ (4 недели)
5. МОТИВАЦИОННОЕ СООБЩЕНИЕ
6. СЛЕДУЮЩИЕ ШАГИ

Ответ предоставьте в JSON формате.
`;

    return basePrompt + dataSection + multilingualSection + instructionsPrompt;
  }

  /**
   * Parses Gemini AI response into structured format
   */
  private parseGeminiResponse(text: string, language: 'ru' | 'kk'): GeminiReportResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.structureGeminiResponse(parsed, language);
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using text parsing...');
    }
    
    // Fallback to text parsing
    return this.parseTextResponse(text, language);
  }

  /**
   * Structures the Gemini response into the expected format
   */
  private structureGeminiResponse(parsed: any, language: 'ru' | 'kk'): GeminiReportResponse {
    return {
      professionalReport: {
        executiveSummary: parsed.executiveSummary || parsed.summary || 'Анализ завершен успешно',
        detailedAnalysis: {
          strengths: parsed.strengths || [],
          areasForImprovement: parsed.areasForImprovement || [],
          keyInsights: parsed.keyInsights || []
        },
        recommendations: {
          immediate: parsed.immediateRecommendations || [],
          shortTerm: parsed.shortTermRecommendations || [],
          longTerm: parsed.longTermRecommendations || []
        },
        actionPlan: {
          week1: parsed.week1 || [],
          week2: parsed.week2 || [],
          week3: parsed.week3 || [],
          week4: parsed.week4 || []
        }
      },
      enhancedRecommendations: {
        posture: parsed.postureRecommendations || [],
        gesticulation: parsed.gestureRecommendations || [],
        facial: parsed.facialRecommendations || [],
        speech: parsed.speechRecommendations || [],
        engagement: parsed.engagementRecommendations || []
      },
      motivationalMessage: parsed.motivationalMessage || this.getDefaultMotivationalMessage(language),
      nextSteps: parsed.nextSteps || []
    };
  }

  /**
   * Parses text response when JSON parsing fails
   */
  private parseTextResponse(text: string, language: 'ru' | 'kk'): GeminiReportResponse {
    const sections = text.split(/\n\s*\n/);
    
    return {
      professionalReport: {
        executiveSummary: this.extractSection(text, ['резюме', 'summary', 'қорытынды']) || 'Анализ завершен',
        detailedAnalysis: {
          strengths: this.extractListItems(text, ['сильные стороны', 'strengths', 'күшті жақтары']),
          areasForImprovement: this.extractListItems(text, ['области для улучшения', 'improvement', 'жақсарту']),
          keyInsights: this.extractListItems(text, ['ключевые инсайты', 'insights', 'түсініктер'])
        },
        recommendations: {
          immediate: this.extractListItems(text, ['немедленные', 'immediate', 'дереу']),
          shortTerm: this.extractListItems(text, ['краткосрочные', 'short-term', 'қысқа мерзім']),
          longTerm: this.extractListItems(text, ['долгосрочные', 'long-term', 'ұзақ мерзім'])
        },
        actionPlan: {
          week1: this.extractListItems(text, ['неделя 1', 'week 1', '1 апта']),
          week2: this.extractListItems(text, ['неделя 2', 'week 2', '2 апта']),
          week3: this.extractListItems(text, ['неделя 3', 'week 3', '3 апта']),
          week4: this.extractListItems(text, ['неделя 4', 'week 4', '4 апта'])
        }
      },
      enhancedRecommendations: {
        posture: this.extractListItems(text, ['поза', 'posture', 'дене қалпы']),
        gesticulation: this.extractListItems(text, ['жесты', 'gestures', 'қимыл']),
        facial: this.extractListItems(text, ['мимика', 'facial', 'мимика']),
        speech: this.extractListItems(text, ['речь', 'speech', 'сөйлеу']),
        engagement: this.extractListItems(text, ['вовлеченность', 'engagement', 'тартымдылық'])
      },
      motivationalMessage: this.extractSection(text, ['мотивация', 'motivation', 'көтеру']) || this.getDefaultMotivationalMessage(language),
      nextSteps: this.extractListItems(text, ['следующие шаги', 'next steps', 'келесі қадамдар'])
    };
  }

  /**
   * Extracts a section from text based on keywords
   */
  private extractSection(text: string, keywords: string[]): string {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[:\s]*([^\\n]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }

  /**
   * Extracts list items from text based on keywords
   */
  private extractListItems(text: string, keywords: string[]): string[] {
    const items: string[] = [];
    
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[:\s]*([\\s\\S]*?)(?=\\n\\s*[А-ЯA-Z]|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        const section = match[1];
        const listItems = section.match(/[-•*]\s*([^\n]+)/g);
        if (listItems) {
          items.push(...listItems.map(item => item.replace(/[-•*]\s*/, '').trim()));
        }
      }
    }
    
    return items.slice(0, 5); // Limit to 5 items
  }

  /**
   * Gets default motivational message
   */
  private getDefaultMotivationalMessage(language: 'ru' | 'kk'): string {
    return language === 'kk' 
      ? 'Сіздің педагогикалық дағдыларыңыз дамып келеді! Үздіксіз жетілдіру арқылы жоғары нәтижелерге жетесіз.'
      : 'Ваши педагогические навыки развиваются! Продолжайте совершенствоваться для достижения высоких результатов.';
  }

  /**
   * Generates fallback report when Gemini AI fails
   */
  private generateFallbackReport(data: GeminiAnalysisRequest): GeminiReportResponse {
    const isKazakh = data.userLanguage === 'kk';
    
    return {
      professionalReport: {
        executiveSummary: isKazakh 
          ? 'Сабақ талдауы аяқталды. Жалпы нәтиже жақсы деңгейде.'
          : 'Анализ урока завершен. Общий результат на хорошем уровне.',
        detailedAnalysis: {
          strengths: isKazakh ? [
            'Сабақ құрылымы жақсы ұйымдастырылған',
            'Материалды түсіндіру дәрежесі жоғары',
            'Студенттермен өзара әрекеттесу бар'
          ] : [
            'Хорошо структурированный урок',
            'Качественное объяснение материала',
            'Присутствует взаимодействие со студентами'
          ],
          areasForImprovement: isKazakh ? [
            'Дене қалпын жақсарту қажет',
            'Сөйлеу қарқынын реттеу',
            'Көбірек көрнекі материалдар пайдалану'
          ] : [
            'Необходимо улучшить осанку',
            'Отрегулировать темп речи',
            'Использовать больше наглядных материалов'
          ],
          keyInsights: isKazakh ? [
            'Көп тілді қолдану студенттерге пайдалы',
            'Интерактивті элементтер қосу керек',
            'Тұрақты дамыту маңызды'
          ] : [
            'Многоязычность полезна для студентов',
            'Нужно добавить интерактивные элементы',
            'Важно постоянное развитие'
          ]
        },
        recommendations: {
          immediate: isKazakh ? [
            'Дұрыс отыру дағдысын қалыптастыру',
            'Сөз-паразиттерді азайту'
          ] : [
            'Работать над правильной осанкой',
            'Сократить использование слов-паразитов'
          ],
          shortTerm: isKazakh ? [
            'Жестикуляция дағдыларын дамыту',
            'Мимика жаттығуларын орындау',
            'Дауыс интонациясын жақсарту'
          ] : [
            'Развивать навыки жестикуляции',
            'Выполнять упражнения для мимики',
            'Улучшать интонацию голоса'
          ],
          longTerm: isKazakh ? [
            'Кәсіби дамыту курстарына қатысу',
            'Тәжірибе алмасу бағдарламаларына қосылу'
          ] : [
            'Участвовать в курсах профессионального развития',
            'Присоединиться к программам обмена опытом'
          ]
        },
        actionPlan: {
          week1: isKazakh ? ['Күнделікті дене қалпын бақылау'] : ['Ежедневный контроль осанки'],
          week2: isKazakh ? ['Жестикуляция жаттығулары'] : ['Упражнения для жестикуляции'],
          week3: isKazakh ? ['Мимика дамыту'] : ['Развитие мимики'],
          week4: isKazakh ? ['Нәтижелерді талдау'] : ['Анализ результатов']
        }
      },
      enhancedRecommendations: {
        posture: isKazakh ? ['Арқаны түзу ұстаңыз'] : ['Держите спину прямо'],
        gesticulation: isKazakh ? ['Табиғи қимылдарды пайдаланыңыз'] : ['Используйте естественные жесты'],
        facial: isKazakh ? ['Көбірек күлімсіреңіз'] : ['Чаще улыбайтесь'],
        speech: isKazakh ? ['Анық сөйлеңіз'] : ['Говорите четко'],
        engagement: isKazakh ? ['Студенттермен көбірек әрекеттесіңіз'] : ['Больше взаимодействуйте со студентами']
      },
      motivationalMessage: this.getDefaultMotivationalMessage(data.userLanguage),
      nextSteps: isKazakh ? [
        'Жоспарды орындау',
        'Прогрессті бақылау',
        'Кері байланыс алу'
      ] : [
        'Выполнение плана',
        'Отслеживание прогресса',
        'Получение обратной связи'
      ]
    };
  }

  /**
   * Generates enhanced recommendations for specific metrics
   */
  async generateEnhancedRecommendations(
    metricType: 'posture' | 'gesticulation' | 'facial' | 'speech' | 'engagement',
    currentScore: number,
    maxScore: number,
    specificData: any,
    language: 'ru' | 'kk'
  ): Promise<string[]> {
    try {
      const prompt = this.buildMetricSpecificPrompt(metricType, currentScore, maxScore, specificData, language);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract recommendations from response
      const recommendations = this.extractListItems(text, ['рекомендации', 'recommendations', 'ұсыныстар']);
      
      return recommendations.length > 0 ? recommendations : this.getFallbackRecommendations(metricType, language);
      
    } catch (error) {
      console.error('Failed to generate enhanced recommendations:', error);
      return this.getFallbackRecommendations(metricType, language);
    }
  }

  /**
   * Builds metric-specific prompt for detailed recommendations
   */
  private buildMetricSpecificPrompt(
    metricType: string,
    currentScore: number,
    maxScore: number,
    specificData: any,
    language: 'ru' | 'kk'
  ): string {
    const percentage = (currentScore / maxScore) * 100;
    
    const basePrompt = language === 'kk' 
      ? `Сіз педагогикалық дағдыларды дамыту бойынша сарапшысыз. ${metricType} дағдысы үшін нақты ұсыныстар беріңіз.`
      : `Вы эксперт по развитию педагогических навыков. Дайте конкретные рекомендации для навыка ${metricType}.`;
    
    const dataPrompt = `
Текущий результат: ${currentScore}/${maxScore} (${percentage.toFixed(1)}%)
Детальные данные: ${JSON.stringify(specificData, null, 2)}
`;

    const instructionPrompt = language === 'kk'
      ? 'Нақты, орындалатын 5-7 ұсыныс беріңіз. Әр ұсыныс бір жолда болуы керек.'
      : 'Предоставьте 5-7 конкретных, выполнимых рекомендаций. Каждая рекомендация должна быть в одной строке.';

    return basePrompt + dataPrompt + instructionPrompt;
  }

  /**
   * Gets fallback recommendations for specific metrics
   */
  private getFallbackRecommendations(metricType: string, language: 'ru' | 'kk'): string[] {
    const recommendations = {
      posture: {
        ru: [
          'Держите спину прямо во время урока',
          'Делайте паузы для проверки осанки',
          'Используйте эргономичную мебель',
          'Выполняйте упражнения для укрепления спины'
        ],
        kk: [
          'Сабақ кезінде арқаңызды түзу ұстаңыз',
          'Дене қалпын тексеру үшін үзіліс жасаңыз',
          'Эргономикалық жиһаз пайдаланыңыз',
          'Арқаны нығайтатын жаттығулар жасаңыз'
        ]
      },
      gesticulation: {
        ru: [
          'Используйте естественные жесты',
          'Практикуйте жестикуляцию перед зеркалом',
          'Изучите педагогические жесты',
          'Координируйте жесты с речью'
        ],
        kk: [
          'Табиғи қимылдарды пайдаланыңыз',
          'Айна алдында қимыл-қозғалыс жаттығыңыз',
          'Педагогикалық қимылдарды үйреніңіз',
          'Қимылдарды сөзбен үйлестіріңіз'
        ]
      },
      facial: {
        ru: [
          'Чаще улыбайтесь во время урока',
          'Поддерживайте зрительный контакт',
          'Работайте над выразительностью лица',
          'Используйте мимику для подчеркивания'
        ],
        kk: [
          'Сабақ кезінде жиі күлімсіреңіз',
          'Көз байланысын сақтаңыз',
          'Бет өрнегінің көрнекілігін дамытыңыз',
          'Баса көрсету үшін мимика пайдаланыңыз'
        ]
      },
      speech: {
        ru: [
          'Говорите четко и разборчиво',
          'Контролируйте темп речи',
          'Сократите слова-паразиты',
          'Расширяйте словарный запас'
        ],
        kk: [
          'Анық және түсінікті сөйлеңіз',
          'Сөйлеу қарқынын бақылаңыз',
          'Сөз-паразиттерді азайтыңыз',
          'Сөздік қорыңызды кеңейтіңіз'
        ]
      },
      engagement: {
        ru: [
          'Увеличьте интерактивность урока',
          'Используйте разнообразные методы',
          'Поддерживайте энергичность',
          'Вовлекайте всех студентов'
        ],
        kk: [
          'Сабақтың интерактивтілігін арттырыңыз',
          'Әртүрлі әдістерді пайдаланыңыз',
          'Серпінділікті сақтаңыз',
          'Барлық студенттерді тартыңыз'
        ]
      }
    };

    return recommendations[metricType as keyof typeof recommendations]?.[language] || [];
  }

  /**
   * Gets service status
   */
  getStatus(): { configured: boolean; model: string; version: string } {
    return {
      configured: !!process.env.GEMINI_API_KEY,
      model: 'gemini-1.5-flash',
      version: '1.5'
    };
  }
}

export const geminiAIService = new GeminiAIService();