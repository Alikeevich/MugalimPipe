import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Netlify Function для безопасной работы с Google Gemini AI API
// API ключ теперь хранится в переменных окружения Netlify, а не в фронтенде
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
    // Получаем секретный ключ из переменных окружения Netlify
    // ВАЖНО: Этот ключ больше не попадает в фронтенд код!
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Gemini API key not configured on server',
          configured: false
        })
      };
    }

    // Инициализируем Gemini AI на сервере
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Парсим входные данные от фронтенда
    const requestData = JSON.parse(event.body || '{}');
    const { 
      action,
      analysisData,
      metricType,
      metricData,
      language = 'ru'
    } = requestData;

    // Обработка разных типов запросов к Gemini AI
    switch (action) {
      case 'generate-professional-report':
        return await handleProfessionalReport(model, analysisData, language);
      
      case 'generate-enhanced-recommendations':
        return await handleEnhancedRecommendations(model, metricType, metricData, language);
      
      case 'test-connection':
        return await handleConnectionTest(model);
      
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
    console.error('Gemini AI error:', error);
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

// Генерация профессионального отчета
async function handleProfessionalReport(model: any, analysisData: any, language: string) {
  try {
    const isKazakh = language === 'kk';
    
    const basePrompt = isKazakh ? `
Сіз педагогикалық дағдыларды талдайтын жетекші сарапшысыз. Мұғалімнің сабағын толық талдап, кәсіби есеп жасаңыз.

ТАЛДАУ ДЕРЕКТЕРІ:
` : `
Вы ведущий эксперт по анализу педагогических навыков. Проанализируйте урок учителя и создайте профессиональный отчет.

ДАННЫЕ АНАЛИЗА:
`;

    const dataSection = `
ТРАНСКРИПЦИЯ РЕЧИ:
${analysisData.transcription}

ВИДЕО АНАЛИЗ:
- Поза и осанка: ${analysisData.scoringResults.metrics.posture.score}/200 баллов
- Жестикуляция: ${analysisData.scoringResults.metrics.gesticulation.score}/200 баллов  
- Мимика: ${analysisData.scoringResults.metrics.facial.score}/200 баллов

АУДИО АНАЛИЗ:
- Речь: ${analysisData.scoringResults.metrics.speech.score}/200 баллов
- Вовлеченность: ${analysisData.scoringResults.metrics.engagement.score}/200 баллов
- Словарный запас: ${analysisData.audioAnalysis.vocabulary.wordCount} слов
- Темп речи: ${analysisData.audioAnalysis.vocabulary.speakingRate} слов/мин
- Слова-паразиты: ${analysisData.audioAnalysis.vocabulary.fillerWords}

ОБЩИЙ РЕЗУЛЬТАТ: ${analysisData.scoringResults.totalScore}/1000 баллов (${analysisData.scoringResults.percentage.toFixed(1)}%)
`;

    const multilingualSection = analysisData.multilingualData ? `
МНОГОЯЗЫЧНЫЙ АНАЛИЗ:
- Обнаружено языков: ${analysisData.multilingualData.detectedLanguages?.length || 1}
- Переключения языков: ${analysisData.multilingualData.languageSwitches || 0}
- Основной язык: ${analysisData.multilingualData.dominantLanguage || 'ru-RU'}
- Смешанная речь: ${analysisData.multilingualData.isMultilingual ? 'Да' : 'Нет'}
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

    const fullPrompt = basePrompt + dataSection + multilingualSection + instructionsPrompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Парсим ответ
    const parsedResponse = parseGeminiResponse(text, language);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        result: parsedResponse
      })
    };

  } catch (error) {
    console.error('Professional report generation failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      })
    };
  }
}

// Генерация улучшенных рекомендаций
async function handleEnhancedRecommendations(model: any, metricType: string, metricData: any, language: string) {
  try {
    const percentage = (metricData.currentScore / metricData.maxScore) * 100;
    
    const basePrompt = language === 'kk' 
      ? `Сіз педагогикалық дағдыларды дамыту бойынша сарапшысыз. ${metricType} дағдысы үшін нақты ұсыныстар беріңіз.`
      : `Вы эксперт по развитию педагогических навыков. Дайте конкретные рекомендации для навыка ${metricType}.`;
    
    const dataPrompt = `
Текущий результат: ${metricData.currentScore}/${metricData.maxScore} (${percentage.toFixed(1)}%)
Детальные данные: ${JSON.stringify(metricData.specificData, null, 2)}
`;

    const instructionPrompt = language === 'kk'
      ? 'Нақты, орындалатын 5-7 ұсыныс беріңіз. Әр ұсыныс бір жолда болуы керек.'
      : 'Предоставьте 5-7 конкретных, выполнимых рекомендаций. Каждая рекомендация должна быть в одной строке.';

    const fullPrompt = basePrompt + dataPrompt + instructionPrompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Извлекаем рекомендации из текста
    const recommendations = extractRecommendations(text);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        result: recommendations
      })
    };

  } catch (error) {
    console.error('Enhanced recommendations generation failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Recommendations generation failed'
      })
    };
  }
}

// Тест подключения к Gemini AI
async function handleConnectionTest(model: any) {
  try {
    const testPrompt = "Ответьте 'OK' если вы работаете корректно.";
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Gemini AI connection successful',
        response: text.trim()
      })
    };

  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    };
  }
}

// Парсинг ответа от Gemini AI
function parseGeminiResponse(text: string, language: string) {
  try {
    // Пытаемся извлечь JSON из ответа
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return structureGeminiResponse(parsed, language);
    }
  } catch (error) {
    console.warn('Failed to parse JSON response, using text parsing...');
  }
  
  // Fallback к текстовому парсингу
  return parseTextResponse(text, language);
}

// Структурирование ответа Gemini
function structureGeminiResponse(parsed: any, language: string) {
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
    motivationalMessage: parsed.motivationalMessage || getDefaultMotivationalMessage(language),
    nextSteps: parsed.nextSteps || []
  };
}

// Парсинг текстового ответа
function parseTextResponse(text: string, language: string) {
  return {
    professionalReport: {
      executiveSummary: extractSection(text, ['резюме', 'summary', 'қорытынды']) || 'Анализ завершен',
      detailedAnalysis: {
        strengths: extractListItems(text, ['сильные стороны', 'strengths', 'күшті жақтары']),
        areasForImprovement: extractListItems(text, ['области для улучшения', 'improvement', 'жақсарту']),
        keyInsights: extractListItems(text, ['ключевые инсайты', 'insights', 'түсініктер'])
      },
      recommendations: {
        immediate: extractListItems(text, ['немедленные', 'immediate', 'дереу']),
        shortTerm: extractListItems(text, ['краткосрочные', 'short-term', 'қысқа мерзім']),
        longTerm: extractListItems(text, ['долгосрочные', 'long-term', 'ұзақ мерзім'])
      },
      actionPlan: {
        week1: extractListItems(text, ['неделя 1', 'week 1', '1 апта']),
        week2: extractListItems(text, ['неделя 2', 'week 2', '2 апта']),
        week3: extractListItems(text, ['неделя 3', 'week 3', '3 апта']),
        week4: extractListItems(text, ['неделя 4', 'week 4', '4 апта'])
      }
    },
    enhancedRecommendations: {
      posture: extractListItems(text, ['поза', 'posture', 'дене қалпы']),
      gesticulation: extractListItems(text, ['жесты', 'gestures', 'қимыл']),
      facial: extractListItems(text, ['мимика', 'facial', 'мимика']),
      speech: extractListItems(text, ['речь', 'speech', 'сөйлеу']),
      engagement: extractListItems(text, ['вовлеченность', 'engagement', 'тартымдылық'])
    },
    motivationalMessage: extractSection(text, ['мотивация', 'motivation', 'көтеру']) || getDefaultMotivationalMessage(language),
    nextSteps: extractListItems(text, ['следующие шаги', 'next steps', 'келесі қадамдар'])
  };
}

// Извлечение секции из текста
function extractSection(text: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\s]*([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
}

// Извлечение списков из текста
function extractListItems(text: string, keywords: string[]): string[] {
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
  
  return items.slice(0, 5); // Ограничиваем до 5 элементов
}

// Извлечение рекомендаций
function extractRecommendations(text: string): string[] {
  const recommendations = extractListItems(text, ['рекомендации', 'recommendations', 'ұсыныстар']);
  
  if (recommendations.length > 0) {
    return recommendations;
  }
  
  // Fallback - разбиваем по строкам и фильтруем
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 10 && !line.includes(':'))
    .slice(0, 7);
}

// Получение мотивационного сообщения по умолчанию
function getDefaultMotivationalMessage(language: string): string {
  return language === 'kk' 
    ? 'Сіздің педагогикалық дағдыларыңыз дамып келеді! Үздіксіз жетілдіру арқылы жоғары нәтижелерге жетесіз.'
    : 'Ваши педагогические навыки развиваются! Продолжайте совершенствоваться для достижения высоких результатов.';
}