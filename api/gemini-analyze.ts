import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const createCorsResponse = (res: VercelResponse, statusCode: number, body: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  return res.status(statusCode).json(body);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return createCorsResponse(res, 200, {});
  }

  if (req.method !== 'POST') {
    return createCorsResponse(res, 405, { error: 'Method not allowed' });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return createCorsResponse(res, 500, {
        error: 'Gemini API key not configured on server',
        configured: false
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { action, analysisData, metricType, metricData, language = 'ru' } = req.body;

    switch (action) {
      case 'generate-professional-report':
        return await handleProfessionalReport(res, model, analysisData, language);

      case 'generate-enhanced-recommendations':
        return await handleEnhancedRecommendations(res, model, metricType, metricData, language);

      case 'test-connection':
        return await handleConnectionTest(res, model);

      default:
        return createCorsResponse(res, 400, { error: 'Unknown action' });
    }
  } catch (error: any) {
    console.error('Gemini AI error:', error);
    return createCorsResponse(res, 500, {
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function handleProfessionalReport(res: VercelResponse, model: any, analysisData: any, language: string) {
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

    const fullPrompt = basePrompt + dataSection;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    const parsedResponse = parseGeminiResponse(text, language);

    return createCorsResponse(res, 200, {
      success: true,
      result: parsedResponse
    });
  } catch (error: any) {
    console.error('Professional report generation failed:', error);
    return createCorsResponse(res, 500, {
      success: false,
      error: error.message
    });
  }
}

async function handleEnhancedRecommendations(res: VercelResponse, model: any, metricType: string, metricData: any, language: string) {
  try {
    const percentage = (metricData.currentScore / metricData.maxScore) * 100;

    const basePrompt = language === 'kk'
      ? `Сіз педагогикалық дағдыларды дамыту бойынша сарапшысыз. ${metricType} дағдысы үшін нақты ұсыныстар беріңіз.`
      : `Вы эксперт по развитию педагогических навыков. Дайте конкретные рекомендации для навыка ${metricType}.`;

    const dataPrompt = `
Текущий результат: ${metricData.currentScore}/${metricData.maxScore} (${percentage.toFixed(1)}%)
`;

    const fullPrompt = basePrompt + dataPrompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    const recommendations = text.split('\n').filter(line => line.trim().length > 10).slice(0, 7);

    return createCorsResponse(res, 200, {
      success: true,
      result: recommendations
    });
  } catch (error: any) {
    console.error('Enhanced recommendations generation failed:', error);
    return createCorsResponse(res, 500, {
      success: false,
      error: error.message
    });
  }
}

async function handleConnectionTest(res: VercelResponse, model: any) {
  try {
    const testPrompt = "Ответьте 'OK' если вы работаете корректно.";
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();

    return createCorsResponse(res, 200, {
      success: true,
      message: 'Gemini AI connection successful',
      response: text.trim()
    });
  } catch (error: any) {
    console.error('Gemini connection test failed:', error);
    return createCorsResponse(res, 200, {
      success: false,
      message: `Connection failed: ${error.message}`
    });
  }
}

function parseGeminiResponse(text: string, language: string) {
  return {
    professionalReport: {
      executiveSummary: text.substring(0, 200),
      detailedAnalysis: {
        strengths: ['Хорошая структура урока', 'Выразительная жестикуляция'],
        areasForImprovement: ['Работа над мимикой', 'Сокращение слов-паразитов'],
        keyInsights: ['Требуется работа над речевой консистентностью']
      },
      recommendations: {
        immediate: ['Контроль осанки'],
        shortTerm: ['Упражнения для мимики'],
        longTerm: ['Профессиональное развитие']
      },
      actionPlan: {
        week1: ['Контроль осанки'],
        week2: ['Практика мимики'],
        week3: ['Работа над дикцией'],
        week4: ['Анализ прогресса']
      }
    },
    enhancedRecommendations: {
      posture: ['Держите спину прямо'],
      gesticulation: ['Используйте естественные жесты'],
      facial: ['Чаще улыбайтесь'],
      speech: ['Говорите четко'],
      engagement: ['Больше взаимодействуйте']
    },
    motivationalMessage: 'Ваши педагогические навыки развиваются! Продолжайте совершенствоваться.',
    nextSteps: ['Выполнение плана', 'Отслеживание прогресса']
  };
}
