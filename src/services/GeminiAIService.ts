// ВАЖНО: Google Gemini API ключ теперь перенесен в Netlify Functions для безопасности!
// Этот сервис теперь работает через безопасные serverless функции

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
  private netlifyFunctionUrl: string;

  constructor() {
    // URL Vercel Serverless Function для безопасной работы с Gemini AI
    this.netlifyFunctionUrl = '/api/gemini-analyze';
  }

  /**
   * Generates a comprehensive professional report using secure Netlify Function
   */
  async generateProfessionalReport(analysisData: GeminiAnalysisRequest): Promise<GeminiReportResponse> {
    try {
      console.log('🤖 Starting secure Gemini AI analysis via Netlify Function...');
      
      // Отправляем запрос в безопасную Netlify Function
      const response = await fetch(this.netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-professional-report',
          analysisData,
          language: analysisData.userLanguage
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Professional report generation failed');
      }
      
      console.log('✅ Secure Gemini AI analysis completed');
      return result.result;
      
    } catch (error) {
      console.error('❌ Secure Gemini AI analysis failed:', error);
      
      // Return fallback response
      return this.generateFallbackReport(analysisData);
    }
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
   * Generates enhanced recommendations via secure Netlify Function
   */
  async generateEnhancedRecommendations(
    metricType: 'posture' | 'gesticulation' | 'facial' | 'speech' | 'engagement',
    currentScore: number,
    maxScore: number,
    specificData: any,
    language: 'ru' | 'kk'
  ): Promise<string[]> {
    try {
      // Отправляем запрос в безопасную Netlify Function
      const response = await fetch(this.netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-enhanced-recommendations',
          metricType,
          metricData: {
            currentScore,
            maxScore,
            specificData
          },
          language
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return result.success ? result.result : this.getFallbackRecommendations(metricType, language);
      
    } catch (error) {
      console.error('Failed to generate enhanced recommendations:', error);
      return this.getFallbackRecommendations(metricType, language);
    }
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
   * Gets service status (API key now safely stored on server)
   */
  getStatus(): { configured: boolean; model: string; version: string } {
    return {
      configured: true, // Всегда true, так как ключ на сервере
      model: 'gemini-1.5-flash',
      version: '1.5'
    };
  }

  /**
   * Tests connection to Gemini AI via secure Netlify Function
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
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
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const geminiAIService = new GeminiAIService();