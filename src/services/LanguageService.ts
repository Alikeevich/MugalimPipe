export type SupportedLanguage = 'ru' | 'kk';

export interface LanguageTexts {
  // Header
  appTitle: string;
  appSubtitle: string;
  teachersCount: string;
  improvementRate: string;

  // Upload Section
  uploadTitle: string;
  uploadSubtitle: string;
  uploadDescription: string;
  dragDropText: string;
  selectFileButton: string;
  supportedFormats: string;
  recommendedDuration: string;
  maxFileSize: string;
  analyzeButton: string;
  analysisInfo: string;

  // Analysis Progress
  analysisTitle: string;
  analysisSubtitle: string;
  overallProgress: string;
  currentStep: string;
  qualityAnalysis: string;
  analysisQuality: string;
  technologies: string;

  // Analysis Steps
  steps: {
    initialization: {
      title: string;
      description: string;
    };
    poseAnalysis: {
      title: string;
      description: string;
    };
    gestureAnalysis: {
      title: string;
      description: string;
    };
    speechAnalysis: {
      title: string;
      description: string;
    };
    contentClassification: {
      title: string;
      description: string;
    };
    scoring: {
      title: string;
      description: string;
    };
  };

  // Features
  featuresTitle: string;
  featuresSubtitle: string;
  features: {
    poseAnalysis: {
      title: string;
      description: string;
    };
    gestureRecognition: {
      title: string;
      description: string;
    };
    facialAnalysis: {
      title: string;
      description: string;
    };
    speechAnalysis: {
      title: string;
      description: string;
    };
    contentClassification: {
      title: string;
      description: string;
    };
    recommendations: {
      title: string;
      description: string;
    };
  };

  // Results Dashboard
  resultsTitle: string;
  resultsSubtitle: string;
  overallResult: string;
  strengths: string;
  priorityAreas: string;
  downloadReport: string;
  share: string;
  newAnalysis: string;

  // Tabs
  tabs: {
    overview: string;
    detailed: string;
    recommendations: string;
    analytics: string;
  };

  // Metrics
  metrics: {
    posture: {
      title: string;
      description: string;
      components: {
        spineAlignment: string;
        shoulderSymmetry: string;
        headPosition: string;
        stability: string;
        confidence: string;
      };
    };
    gesticulation: {
      title: string;
      description: string;
      components: {
        variety: string;
        frequency: string;
        appropriateness: string;
        expressiveness: string;
        coordination: string;
      };
    };
    facial: {
      title: string;
      description: string;
      components: {
        expressiveness: string;
        eyeContact: string;
        smileFrequency: string;
        emotionalRange: string;
        authenticity: string;
      };
    };
    speech: {
      title: string;
      description: string;
      components: {
        clarity: string;
        pace: string;
        volume: string;
        vocabulary: string;
        grammar: string;
      };
    };
    engagement: {
      title: string;
      description: string;
      components: {
        attention: string;
        interaction: string;
        energy: string;
        presence: string;
        charisma: string;
      };
    };
  };

  // Yandex SpeechKit
  yandexConfig: {
    title: string;
    connected: string;
    error: string;
    hide: string;
    configure: string;
    apiKey: string;
    folderId: string;
    useYandex: string;
    testConnection: string;
    testing: string;
    autoFill: string;
    info: string;
  };

  // Common
  progress: string;
  quality: string;
  score: string;
  recommendations: string;
  moreDetails: string;
  improvementPlan: string;
  scoreDistribution: string;
  performanceInsights: string;
  improvementAreas: string;
}

class LanguageService {
  private currentLanguage: SupportedLanguage = 'ru';
  private texts: Record<SupportedLanguage, LanguageTexts>;

  constructor() {
    this.texts = {
      ru: {
        // Header
        appTitle: "AI Педагог Анализатор",
        appSubtitle: "Улучшайте свои педагогические навыки с помощью MediaPipe и ИИ",
        teachersCount: "5000+ педагогов",
        improvementRate: "98% улучшений",

        // Upload Section
        uploadTitle: "Проанализируйте свой урок",
        uploadSubtitle: "с помощью ИИ",
        uploadDescription: "Загрузите видео своего урока (10-15 минут) и получите детальный анализ вашей позы, жестикуляции, мимики и речи с персональными рекомендациями от ИИ",
        dragDropText: "Перетащите файл сюда или нажмите для выбора",
        selectFileButton: "Выбрать файл",
        supportedFormats: "Поддерживаемые форматы: MP4, AVI, MOV, WebM",
        recommendedDuration: "Рекомендуемая длительность: 10-15 минут",
        maxFileSize: "Максимальный размер: 500 МБ",
        analyzeButton: "Начать анализ урока",
        analysisInfo: "Анализ займет около 2-3 минут. Мы используем передовые технологии MediaPipe и Google Gemini AI",

        // Analysis Progress
        analysisTitle: "Комплексный анализ урока",
        analysisSubtitle: "Система 1000-балльной оценки педагогического мастерства",
        overallProgress: "Общий прогресс анализа",
        currentStep: "Текущий этап",
        qualityAnalysis: "Качество анализа",
        analysisQuality: "Анализ",
        technologies: "Технологии анализа",

        // Analysis Steps
        steps: {
          initialization: {
            title: "Инициализация MediaPipe",
            description: "Загрузка моделей для анализа позы, жестов и мимики"
          },
          poseAnalysis: {
            title: "Анализ позы и движений",
            description: "Детальный анализ осанки, стабильности и уверенности"
          },
          gestureAnalysis: {
            title: "Анализ жестов и мимики",
            description: "Оценка выразительности, разнообразия и уместности жестов"
          },
          speechAnalysis: {
            title: "Анализ речи и аудио",
            description: "Обработка аудио, транскрипция и анализ словарного запаса"
          },
          contentClassification: {
            title: "Классификация контента",
            description: "Анализ структуры урока и образовательного содержания"
          },
          scoring: {
            title: "Расчет итоговых баллов",
            description: "Комплексная оценка по 1000-балльной системе"
          }
        },

        // Features
        featuresTitle: "Что мы анализируем",
        featuresSubtitle: "Наш ИИ использует передовые технологии MediaPipe для комплексного анализа ваших педагогических навыков",
        features: {
          poseAnalysis: {
            title: "Анализ позы (MediaPipe)",
            description: "33 точки отслеживания позы для оценки осанки и движений"
          },
          gestureRecognition: {
            title: "Распознавание жестов",
            description: "Анализ жестов рук с определением 8+ типов жестов"
          },
          facialAnalysis: {
            title: "Анализ мимики",
            description: "468 точек лица для оценки эмоциональной выразительности"
          },
          speechAnalysis: {
            title: "Анализ речи",
            description: "Обработка аудио для анализа словарного запаса и дикции"
          },
          contentClassification: {
            title: "Классификация контента",
            description: "ИИ анализ структуры и содержания урока"
          },
          recommendations: {
            title: "Персональные рекомендации",
            description: "Индивидуальные советы на основе анализа данных"
          }
        },

        // Results Dashboard
        resultsTitle: "Результаты анализа",
        resultsSubtitle: "Комплексная оценка педагогического мастерства по 1000-балльной системе",
        overallResult: "Общий результат",
        strengths: "Ваши сильные стороны",
        priorityAreas: "Приоритетные области для развития",
        downloadReport: "Скачать отчет",
        share: "Поделиться",
        newAnalysis: "Новый анализ",

        // Tabs
        tabs: {
          overview: "Обзор",
          detailed: "Детальный анализ",
          recommendations: "Рекомендации",
          analytics: "Аналитика"
        },

        // Metrics
        metrics: {
          posture: {
            title: "Поза и осанка",
            description: "Анализ осанки, стабильности и уверенности",
            components: {
              spineAlignment: "Выравнивание позвоночника",
              shoulderSymmetry: "Симметрия плеч",
              headPosition: "Положение головы",
              stability: "Стабильность",
              confidence: "Уверенность"
            }
          },
          gesticulation: {
            title: "Жестикуляция",
            description: "Оценка выразительности и разнообразия жестов",
            components: {
              variety: "Разнообразие",
              frequency: "Частота",
              appropriateness: "Уместность",
              expressiveness: "Выразительность",
              coordination: "Координация"
            }
          },
          facial: {
            title: "Мимика",
            description: "Анализ выражения лица и зрительного контакта",
            components: {
              expressiveness: "Выразительность",
              eyeContact: "Зрительный контакт",
              smileFrequency: "Частота улыбок",
              emotionalRange: "Эмоциональный диапазон",
              authenticity: "Естественность"
            }
          },
          speech: {
            title: "Речь",
            description: "Оценка дикции, темпа и словарного запаса",
            components: {
              clarity: "Четкость",
              pace: "Темп",
              volume: "Громкость",
              vocabulary: "Словарный запас",
              grammar: "Грамматика"
            }
          },
          engagement: {
            title: "Вовлеченность",
            description: "Анализ харизмы и способности удерживать внимание",
            components: {
              attention: "Внимание",
              interaction: "Взаимодействие",
              energy: "Энергия",
              presence: "Присутствие",
              charisma: "Харизма"
            }
          }
        },

        // Yandex SpeechKit
        yandexConfig: {
          title: "Настройки Yandex SpeechKit",
          connected: "Подключено",
          error: "Ошибка",
          hide: "Скрыть",
          configure: "Настроить",
          apiKey: "API Ключ",
          folderId: "Folder ID",
          useYandex: "Использовать Yandex SpeechKit",
          testConnection: "Тест подключения",
          testing: "Тестирование...",
          autoFill: "Заполнить автоматически",
          info: "Используйте ваши учетные данные Yandex Cloud для получения высококачественной транскрипции речи."
        },

        // Common
        progress: "Прогресс",
        quality: "Качество",
        score: "Баллы",
        recommendations: "Рекомендации для улучшения",
        moreDetails: "Подробнее",
        improvementPlan: "План развития на 6 недель",
        scoreDistribution: "Распределение баллов",
        performanceInsights: "Сильные стороны",
        improvementAreas: "Области для улучшения"
      },

      kk: {
        // Header
        appTitle: "AI Мұғалім Анализаторы",
        appSubtitle: "MediaPipe және AI көмегімен педагогикалық дағдыларыңызды жетілдіріңіз",
        teachersCount: "5000+ мұғалім",
        improvementRate: "98% жақсарту",

        // Upload Section
        uploadTitle: "Сабағыңызды талдаңыз",
        uploadSubtitle: "AI көмегімен",
        uploadDescription: "Сабағыңыздың видеосын жүктеп (10-15 минут), дене қалпы, қимыл-қозғалыс, мимика және сөйлеу тілінің толық талдауын AI-дан жеке ұсыныстармен алыңыз",
        dragDropText: "Файлды осы жерге сүйреңіз немесе таңдау үшін басыңыз",
        selectFileButton: "Файл таңдау",
        supportedFormats: "Қолдау көрсетілетін форматтар: MP4, AVI, MOV, WebM",
        recommendedDuration: "Ұсынылатын ұзақтығы: 10-15 минут",
        maxFileSize: "Максималды өлшемі: 500 МБ",
        analyzeButton: "Сабақ талдауын бастау",
        analysisInfo: "Талдау шамамен 2-3 минут уақыт алады. Біз MediaPipe және Google Gemini AI озық технологияларын пайдаланамыз",

        // Analysis Progress
        analysisTitle: "Сабақтың кешенді талдауы",
        analysisSubtitle: "Педагогикалық шеберлікті 1000 балдық жүйемен бағалау",
        overallProgress: "Талдаудың жалпы барысы",
        currentStep: "Ағымдағы кезең",
        qualityAnalysis: "Талдау сапасы",
        analysisQuality: "Талдау",
        technologies: "Талдау технологиялары",

        // Analysis Steps
        steps: {
          initialization: {
            title: "MediaPipe инициализациясы",
            description: "Дене қалпы, қимыл және мимика талдауына арналған модельдерді жүктеу"
          },
          poseAnalysis: {
            title: "Дене қалпы мен қозғалысты талдау",
            description: "Дұрыс отыру, тұрақтылық және сенімділікті толық талдау"
          },
          gestureAnalysis: {
            title: "Қимыл және мимика талдауы",
            description: "Көрнекілік, әртүрлілік және қимылдардың орындылығын бағалау"
          },
          speechAnalysis: {
            title: "Сөйлеу және аудио талдауы",
            description: "Аудио өңдеу, транскрипция және сөздік қорын талдау"
          },
          contentClassification: {
            title: "Мазмұн классификациясы",
            description: "Сабақ құрылымы мен білім беру мазмұнын талдау"
          },
          scoring: {
            title: "Қорытынды балдарды есептеу",
            description: "1000 балдық жүйе бойынша кешенді бағалау"
          }
        },

        // Features
        featuresTitle: "Біз нені талдаймыз",
        featuresSubtitle: "Біздің AI педагогикалық дағдыларыңызды кешенді талдау үшін MediaPipe озық технологияларын пайдаланады",
        features: {
          poseAnalysis: {
            title: "Дене қалпын талдау (MediaPipe)",
            description: "Дұрыс отыру мен қозғалысты бағалау үшін 33 нүктені қадағалау"
          },
          gestureRecognition: {
            title: "Қимылдарды тану",
            description: "8+ түрлі қимылды анықтаумен қол қимылдарын талдау"
          },
          facialAnalysis: {
            title: "Мимика талдауы",
            description: "Эмоционалды көрнекілікті бағалау үшін беттің 468 нүктесі"
          },
          speechAnalysis: {
            title: "Сөйлеу талдауы",
            description: "Сөздік қор мен дикцияны талдау үшін аудио өңдеу"
          },
          contentClassification: {
            title: "Мазмұн классификациясы",
            description: "Сабақ құрылымы мен мазмұнын AI талдауы"
          },
          recommendations: {
            title: "Жеке ұсыныстар",
            description: "Деректерді талдау негізінде жеке кеңестер"
          }
        },

        // Results Dashboard
        resultsTitle: "Талдау нәтижелері",
        resultsSubtitle: "1000 балдық жүйе бойынша педагогикалық шеберлікті кешенді бағалау",
        overallResult: "Жалпы нәтиже",
        strengths: "Сіздің күшті жақтарыңыз",
        priorityAreas: "Дамыту үшін басым бағыттар",
        downloadReport: "Есепті жүктеп алу",
        share: "Бөлісу",
        newAnalysis: "Жаңа талдау",

        // Tabs
        tabs: {
          overview: "Шолу",
          detailed: "Толық талдау",
          recommendations: "Ұсыныстар",
          analytics: "Аналитика"
        },

        // Metrics
        metrics: {
          posture: {
            title: "Дене қалпы",
            description: "Дұрыс отыру, тұрақтылық және сенімділікті талдау",
            components: {
              spineAlignment: "Омыртқаның тегістігі",
              shoulderSymmetry: "Иық симметриясы",
              headPosition: "Бас қалпы",
              stability: "Тұрақтылық",
              confidence: "Сенімділік"
            }
          },
          gesticulation: {
            title: "Қимыл-қозғалыс",
            description: "Көрнекілік пен қимылдардың әртүрлілігін бағалау",
            components: {
              variety: "Әртүрлілік",
              frequency: "Жиілік",
              appropriateness: "Орындылық",
              expressiveness: "Көрнекілік",
              coordination: "Үйлесімділік"
            }
          },
          facial: {
            title: "Мимика",
            description: "Бет өрнегі мен көз байланысын талдау",
            components: {
              expressiveness: "Көрнекілік",
              eyeContact: "Көз байланысы",
              smileFrequency: "Күлкі жиілігі",
              emotionalRange: "Эмоционалды ауқым",
              authenticity: "Табиғилық"
            }
          },
          speech: {
            title: "Сөйлеу",
            description: "Дикция, қарқын және сөздік қорды бағалау",
            components: {
              clarity: "Анықтық",
              pace: "Қарқын",
              volume: "Дауыс күші",
              vocabulary: "Сөздік қор",
              grammar: "Грамматика"
            }
          },
          engagement: {
            title: "Тартымдылық",
            description: "Харизма мен назар аудару қабілетін талдау",
            components: {
              attention: "Назар",
              interaction: "Өзара әрекеттесу",
              energy: "Энергия",
              presence: "Қатысу",
              charisma: "Харизма"
            }
          }
        },

        // Yandex SpeechKit
        yandexConfig: {
          title: "Yandex SpeechKit баптаулары",
          connected: "Қосылған",
          error: "Қате",
          hide: "Жасыру",
          configure: "Баптау",
          apiKey: "API кілті",
          folderId: "Folder ID",
          useYandex: "Yandex SpeechKit пайдалану",
          testConnection: "Қосылымды тексеру",
          testing: "Тексеру...",
          autoFill: "Автоматты толтыру",
          info: "Жоғары сапалы сөйлеу транскрипциясын алу үшін Yandex Cloud тіркелгі деректеріңізді пайдаланыңыз."
        },

        // Common
        progress: "Барыс",
        quality: "Сапа",
        score: "Балл",
        recommendations: "Жақсарту ұсыныстары",
        moreDetails: "Толығырақ",
        improvementPlan: "6 аптаға арналған даму жоспары",
        scoreDistribution: "Балдардың бөлінуі",
        performanceInsights: "Күшті жақтар",
        improvementAreas: "Жақсарту салалары"
      }
    };
  }

  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  getText(): LanguageTexts {
    return this.texts[this.currentLanguage];
  }

  getAvailableLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
    return [
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' }
    ];
  }
}

export const languageService = new LanguageService();