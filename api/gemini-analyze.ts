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
        error: 'Gemini API key not configured',
        configured: false
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });

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
    const isRussian = language === 'ru';

    const systemPrompt = isRussian ? `
Вы профессиональный эксперт по анализу педагогического мастерства с 20-летним опытом.

ВАЖНО: АНАЛИЗИРУЙТЕ КОНКРЕТНУЮ ТРАНСКРИПЦИЮ РЕЧИ УЧИТЕЛЯ!
- Цитируйте конкретные фразы из транскрипции
- Указывайте на конкретные слова-паразиты которые использует учитель
- Анализируйте конкретные формулировки и термины
- Давайте рекомендации основанные на РЕАЛЬНЫХ словах учителя

ФОРМАТ ОТВЕТА - СТРОГО JSON:
{
  "executiveSummary": "2-3 предложения с ОБЯЗАТЕЛЬНЫМ упоминанием конкретных моментов из речи",
  "detailedAnalysis": {
    "strengths": ["конкретная цитата или фраза + почему хорошо", "еще одна сильная сторона", "третья", "четвертая"],
    "areasForImprovement": ["конкретная проблема + КАК исправить", "вторая зона + решение", "третья", "четвертая"],
    "keyInsights": ["инсайт из анализа речи", "инсайт про стиль", "инсайт про взаимодействие"]
  },
  "recommendations": {
    "immediate": ["что сделать на следующем уроке", "какую фразу изменить"],
    "shortTerm": ["упражнения", "какие слова заменить на..."],
    "longTerm": ["стратегические цели", "какие фразы выучить"]
  },
  "actionPlan": {
    "week1": ["нақты тапсырма + мысал", "тапсырма 2", "тапсырма 3"],
    "week2": ["задача 1", "задача 2", "задача 3"],
    "week3": ["задача 1", "задача 2", "задача 3"],
    "week4": ["задача 1", "задача 2", "задача 3"]
  },
  "motivationalMessage": "вдохновляющее сообщение с упоминанием конкретного успеха",
  "nextSteps": ["шаг 1", "шаг 2", "шаг 3"]
}
` : `
Сіз 20 жылдық тәжірибесі бар педагогикалық шеберлікті талдау жөніндегі кәсіби сарапшысыз.

МАҢЫЗДЫ: МҰҒАЛІМНІҢ НАҚТЫ СӨЙЛЕГЕН СӨЗДЕРІН ТАЛДАҢЫЗ!

ЖАУАП ФОРМАТЫ - ҚАТАҢ JSON:
{
  "executiveSummary": "2-3 сөйлем, сөйлеуден нақты мысалдармен",
  "detailedAnalysis": {
    "strengths": ["нақты жақсы сөйлем + неге жақсы", "екінші", "үшінші", "төртінші"],
    "areasForImprovement": ["нақты проблема + ҚАЛАЙ түзету", "екінші + шешім", "үшінші", "төртінші"],
    "keyInsights": ["инсайт", "стиль туралы инсайт", "өзара әрекеттесу туралы"]
  },
  "recommendations": {
    "immediate": ["келесі сабақта не айту керек", "қай сөзді өзгерту"],
    "shortTerm": ["жаттығулар", "қай сөздерді ауыстыру"],
    "longTerm": ["стратегиялық мақсаттар", "сөз тіркестерін жаттау"]
  },
  "actionPlan": {
    "week1": ["нақты тапсырма", "тапсырма 2", "тапсырма 3"],
    "week2": ["тапсырма 1", "тапсырма 2", "тапсырма 3"],
    "week3": ["тапсырма 1", "тапсырма 2", "тапсырма 3"],
    "week4": ["тапсырма 1", "тапсырма 2", "тапсырма 3"]
  },
  "motivationalMessage": "шабыттандыратын хабарлама",
  "nextSteps": ["1-қадам", "2-қадам", "3-қадам"]
}
`;

    const transcription = analysisData.transcription || '';
    const fillerWordsFound = findFillerWords(transcription);
    const keyPhrases = extractKeyPhrases(transcription);
    const greetingAnalysis = analyzeGreeting(transcription);
    const instructionsAnalysis = analyzeInstructions(transcription);

    const dataSection = `
=== ДЕТАЛЬНЫЙ АНАЛИЗ ТРАНСКРИПЦИИ ===

ПОЛНАЯ ТРАНСКРИПЦИЯ РЕЧИ УЧИТЕЛЯ:
"${transcription}"

=== АНАЛИЗ КОНКРЕТНЫХ СЛОВ ===

НАЙДЕНЫ СЛОВА-ПАРАЗИТЫ (конкретные примеры):
${fillerWordsFound.length > 0 ? fillerWordsFound.map(fw => `- "${fw.word}" использовано ${fw.count} раз(а) - ЗАМЕНИТЬ НА: ${fw.replacement}`).join('\n') : 'Слова-паразиты не найдены'}

КЛЮЧЕВЫЕ ФРАЗЫ КОТОРЫЕ ИСПОЛЬЗОВАЛ УЧИТЕЛЬ:
${keyPhrases.length > 0 ? keyPhrases.map(kp => `- "${kp}"`).join('\n') : 'Нет данных'}

АНАЛИЗ ПРИВЕТСТВИЯ:
${greetingAnalysis.found ? `✅ Найдено: "${greetingAnalysis.text}"` : '❌ Приветствие не найдено'}

АНАЛИЗ ИНСТРУКЦИЙ:
${instructionsAnalysis.hasClearInstructions ? `✅ Инструкции даны четко` : '❌ Инструкции нечеткие'}

=== ЧИСЛОВЫЕ МЕТРИКИ ===

- Поза: ${analysisData.scoringResults.metrics.posture.score}/200
- Жестикуляция: ${analysisData.scoringResults.metrics.gesticulation.score}/200
- Мимика: ${analysisData.scoringResults.metrics.facial.score}/200
- Речь: ${analysisData.scoringResults.metrics.speech.score}/200
- Вовлеченность: ${analysisData.scoringResults.metrics.engagement.score}/200
- Общий результат: ${analysisData.scoringResults.totalScore}/1000 (${analysisData.scoringResults.percentage.toFixed(1)}%) — ${analysisData.scoringResults.grade}
`;

    const fullPrompt = systemPrompt + '\n\n' + dataSection;

    console.log('🤖 Generating AI report...');
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);

    let parsedResponse: any;
    if (jsonMatch) {
      try {
        const aiData = JSON.parse(jsonMatch[0]);
        parsedResponse = {
          professionalReport: {
            executiveSummary: aiData.executiveSummary || '',
            detailedAnalysis: aiData.detailedAnalysis || { strengths: [], areasForImprovement: [], keyInsights: [] },
            recommendations: aiData.recommendations || { immediate: [], shortTerm: [], longTerm: [] },
            actionPlan: aiData.actionPlan || { week1: [], week2: [], week3: [], week4: [] },
          },
          enhancedRecommendations: { posture: [], gesticulation: [], facial: [], speech: [], engagement: [] },
          motivationalMessage: aiData.motivationalMessage || '',
          nextSteps: aiData.nextSteps || []
        };
      } catch (e) {
        console.error('Failed to parse JSON, using fallback');
        parsedResponse = createFallbackReport(analysisData, language, transcription, fillerWordsFound);
      }
    } else {
      parsedResponse = createFallbackReport(analysisData, language, transcription, fillerWordsFound);
    }

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

function findFillerWords(transcription: string): Array<{word: string, count: number, replacement: string}> {
  const fillerWordsMap: Record<string, string> = {
    'ну': 'пауза',
    'эм': 'пауза',
    'ах': 'пауза',
    'короче': 'итак',
    'типа': 'например',
    'как бы': 'пауза',
    'вот': 'пауза',
    'значит': 'итак',
    'собственно': 'пауза',
    'вроде': 'пауза'
  };

  const result: Array<{word: string, count: number, replacement: string}> = [];
  const lowerTranscription = transcription.toLowerCase();

  Object.entries(fillerWordsMap).forEach(([word, replacement]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerTranscription.match(regex);
    if (matches && matches.length > 0) {
      result.push({ word, count: matches.length, replacement });
    }
  });

  return result.sort((a, b) => b.count - a.count);
}

function extractKeyPhrases(transcription: string): string[] {
  const phrases: string[] = [];
  const greetingMatch = transcription.match(/^(здравствуйте|привет|добрый день|доброе утро)/i);
  if (greetingMatch) phrases.push(greetingMatch[0]);

  const instructionPatterns = [
    /откройте (учебник|тетрадь|страницу)/i,
    /запишите (в тетрадь|себе)/i,
    /посмотрите на/i,
    /давайте (начнем|рассмотрим)/i,
    /сегодня мы (изучим|рассмотрим|узнаем)/i
  ];

  instructionPatterns.forEach(pattern => {
    const match = transcription.match(pattern);
    if (match) phrases.push(match[0]);
  });

  return phrases;
}

function analyzeGreeting(transcription: string): {found: boolean, text: string} {
  const greetingMatch = transcription.match(/^(здравствуйте|привет|добрый день|доброе утро)[,!.\s]{0,10}([а-яё\s,]{0,30})/i);
  if (greetingMatch) {
    return { found: true, text: greetingMatch[0].trim() };
  }
  return { found: false, text: '' };
}

function analyzeInstructions(transcription: string): {hasClearInstructions: boolean, examples: string[]} {
  const instructionPatterns = [
    /откройте (учебник|тетрадь|страницу)/i,
    /запишите (в тетрадь|себе)/i,
    /посмотрите на/i
  ];

  const examples: string[] = [];
  let hasClearInstructions = false;

  instructionPatterns.forEach(pattern => {
    const match = transcription.match(pattern);
    if (match) {
      hasClearInstructions = true;
      examples.push(match[0]);
    }
  });

  return { hasClearInstructions, examples };
}

function createFallbackReport(
  analysisData: any,
  language: string,
  transcription?: string,
  fillerWordsFound?: Array<{word: string, count: number, replacement: string}>
) {
  const isRussian = language === 'ru';
  const score = analysisData.scoringResults.totalScore;
  const percentage = analysisData.scoringResults.percentage;

  const fillerSummary = fillerWordsFound && fillerWordsFound.length > 0
    ? fillerWordsFound.slice(0, 3).map(fw => `"${fw.word}" (${fw.count}x → "${fw.replacement}")`).join(', ')
    : (isRussian ? 'не обнаружены' : 'табылмады');

  const transcriptionSnippet = transcription
    ? `"${transcription.slice(0, 80)}${transcription.length > 80 ? '...' : ''}"`
    : '';

  let strengths: string[] = [];
  let areasForImprovement: string[] = [];
  let motivationalMessage = '';

  if (score >= 800) {
    strengths = isRussian ? [
      `Отличная структура урока${transcriptionSnippet ? ` — сильное начало: ${transcriptionSnippet}` : ''}`,
      'Уверенная поза и осанка на протяжении всего урока',
      'Выразительная жестикуляция и активный зрительный контакт',
      'Грамотная речь с минимальными словами-паразитами'
    ] : [
      'Сабақтың тамаша құрылымы',
      'Сенімді дене бітімі',
      'Мәнерлі ым-ишара',
      'Аудиториямен жақсы көз байланысы'
    ];
    areasForImprovement = isRussian ? [
      'Добавить больше интерактивных элементов в урок',
      'Следить за темпом речи в ключевые моменты объяснения'
    ] : [
      'Интерактивті элементтерді көбірек қосу',
      'Негізгі сәттерде сөйлеу қарқынын бақылау'
    ];
    motivationalMessage = isRussian
      ? 'Превосходная работа! Ваш профессионализм на высоком уровне. Продолжайте совершенствоваться!'
      : 'Керемет жұмыс! Жетілдіруді жалғастырыңыз!';
  } else if (score >= 600) {
    strengths = isRussian ? [
      'Хорошая базовая структура урока',
      'Стабильная поза во время объяснений',
      'Использование жестов для акцентирования ключевых моментов',
      'Достаточный зрительный контакт с аудиторией'
    ] : [
      'Сабақтың жақсы негізгі құрылымы',
      'Тұрақты дене бітімі',
      'Ым-ишараны қолдану',
      'Жеткілікті көз байланысы'
    ];
    areasForImprovement = isRussian ? [
      `Слова-паразиты: ${fillerSummary} — заменяйте осознанными паузами`,
      'Разнообразить жестикуляцию для большей выразительности',
      'Добавить больше эмоциональной выразительности в мимику',
      'Работать над стабильностью позы в динамичных моментах'
    ] : [
      `Паразит сөздер: ${fillerSummary}`,
      'Ым-ишараны әртараптандыру',
      'Эмоционалды өрнектеуді көбейту',
      'Дене бітімінің тұрақтылығымен жұмыс'
    ];
    motivationalMessage = isRussian
      ? 'Хороший результат! У вас solid база. Сфокусируйтесь на приоритетах!'
      : 'Жақсы нәтиже! Ұсыныстарға назар аударыңыз!';
  } else {
    strengths = isRussian ? [
      `Понимание материала урока${transcriptionSnippet ? ` (видно из речи: ${transcriptionSnippet})` : ''}`,
      'Попытки использовать жесты для объяснений',
      'Стремление к зрительному контакту с учениками'
    ] : [
      'Сабақ материалын түсіну',
      'Ым-ишараны қолдану әрекеттері',
      'Көз байланысына ұмтылыс'
    ];
    areasForImprovement = isRussian ? [
      `Слова-паразиты: ${fillerSummary} — критически важно устранить`,
      'Работать над осанкой — держать спину прямо',
      'Развивать выразительность жестов и мимики',
      'Добавить больше энергии и вовлечённости',
      'Практиковать зрительный контакт со всеми учениками'
    ] : [
      `Паразит сөздер: ${fillerSummary}`,
      'Дене бітімімен жұмыс',
      'Ым-ишара мәнерлілігін дамыту',
      'Энергия мен белсенділік',
      'Барлық оқушылармен көз байланысы'
    ];
    motivationalMessage = isRussian
      ? 'Каждый эксперт когда-то начинал! Используйте эти рекомендации как план развития. У вас всё получится!'
      : 'Барлық сарапшы қайдан да бастаған! Сіз бәрін істей аласыз!';
  }

  return {
    professionalReport: {
      executiveSummary: isRussian
        ? `Результат анализа: ${score}/1000 (${percentage.toFixed(1)}%). ${score >= 600 ? 'Хороший уровень с потенциалом роста.' : 'Есть зоны для улучшения.'}`
        : `Талдау нәтижесі: ${score}/1000 (${percentage.toFixed(1)}%). ${score >= 600 ? 'Жақсы деңгей.' : 'Жақсарту аймақтары бар.'}`,
      detailedAnalysis: {
        strengths,
        areasForImprovement,
        keyInsights: isRussian ? [
          'Наибольший потенциал в развитии жестикуляции',
          'Речь требует работы над чистотой и паузами',
          'Вовлечённость можно улучшить через энергию подачи'
        ] : [
          'Ым-ишараны дамытуда үлкен әлеует',
          'Сөйлеу тазалығымен жұмыс қажет',
          'Энергия арқылы қатысуды жақсарту'
        ]
      },
      recommendations: {
        immediate: isRussian ? [
          `Записывать себя на видео и считать слова-паразиты (обнаружено: ${fillerSummary})`,
          'Практиковать позу у стены 5 минут перед каждым уроком',
          'Делать паузы вместо "эм", "ну", "значит"'
        ] : [
          `Бейнеге жазу және паразит сөздерді санау (табылды: ${fillerSummary})`,
          'Күніне 5 минут қабырға жанында жаттығу',
          'Паразит сөздер орнына үзіліс жасау'
        ],
        shortTerm: isRussian ? [
          'Курс по ораторскому мастерству (2-4 недели)',
          'Ежедневные упражнения для выразительности жестов',
          'Практика осознанной речи с записью'
        ] : [
          'Шешендік өнер курсы',
          'Ым-ишара жаттығулары',
          'Саналы сөйлеуді жаттығу'
        ],
        longTerm: isRussian ? [
          'Профессиональное развитие педагогических навыков',
          'Участие в мастер-классах и семинарах',
          'Работа с ментором или тренером'
        ] : [
          'Педагогикалық дағдыларды кәсіби дамыту',
          'Шеберлік сыныптарына қатысу',
          'Ментормен жұмыс'
        ]
      },
      actionPlan: {
        week1: isRussian
          ? ['Контроль осанки + 3 записи урока на видео', 'Записать и подсчитать слова-паразиты', 'Упражнение "стенка" 5 мин/день']
          : ['Дене бітімін бақылау + 3 бейне жазу', 'Паразит сөздерді санау', '"Қабырға" жаттығуы 5 мин/күн'],
        week2: isRussian
          ? ['Упражнения для жестов 10 мин/день', 'Практика улыбки и мимики перед зеркалом', 'Работа над темпом речи']
          : ['Ым-ишара жаттығулары 10 мин/күн', 'Күлкіні жаттығу', 'Сөйлеу қарқыны'],
        week3: isRussian
          ? ['Зрительный контакт — "маяк" техника', 'Эмоциональность — реагировать мимикой', 'Структура урока: цель + итог']
          : ['Көз байланысы', 'Эмоционалдылық', 'Сабақ құрылымы'],
        week4: isRussian
          ? ['Анализ прогресса — сравнить первое и последнее видео', 'Составить план на следующий месяц', 'Отметить достижения']
          : ['Прогресті талдау', 'Келесі айға жоспар', 'Жетістіктерді атау']
      }
    },
    enhancedRecommendations: {
      posture: isRussian ? ['Держать спину прямо', 'Расправить плечи', 'Контролировать положение головы'] : ['Арқаны тік ұстау', 'Иықты жазу', 'Бас позициясын бақылау'],
      gesticulation: isRussian ? ['Открытые жесты к аудитории', 'Избегать скрещенных рук', 'Жестикулировать естественно'] : ['Ашық ым-ишара', 'Қолды айқастырмау', 'Табиғи қозғалыс'],
      facial: isRussian ? ['Чаще улыбаться', 'Поддерживать зрительный контакт', 'Показывать эмоции'] : ['Күлімсіреу', 'Көз байланысы', 'Эмоция көрсету'],
      speech: isRussian ? [`Устранить: ${fillerSummary}`, 'Контролировать темп (120-160 слов/мин)', 'Делать паузы для акцента'] : [`Жою: ${fillerSummary}`, 'Қарқынды бақылау', 'Пауза жасау'],
      engagement: isRussian ? ['Добавлять энергию', 'Задавать риторические вопросы', 'Показывать энтузиазм'] : ['Энергия қосу', 'Риторикалық сұрақтар', 'Ынта-ықылас']
    },
    motivationalMessage,
    nextSteps: isRussian
      ? ['Изучить рекомендации и выбрать 3 главных', 'Записать первое видео сегодня', 'Начать с малых шагов каждый день']
      : ['Ұсыныстарды зерттеу', 'Бүгін бейне жазу', 'Кішігірім қадамдардан бастау']
  };
}

async function handleEnhancedRecommendations(res: VercelResponse, model: any, metricType: string, metricData: any, language: string) {
  try {
    const percentage = (metricData.currentScore / metricData.maxScore) * 100;

    const prompts: Record<string, { ru: string; kk: string }> = {
      posture: {
        ru: `Вы эксперт по телесному языку педагога. Дайте 5 конкретных рекомендаций для улучшения осанки и позы учителя. Текущий результат: ${percentage.toFixed(0)}%.`,
        kk: `Сіз педагогтың дене тілі бойынша сарапшысыз. Мұғалімнің дене бітімін жақсарту үшін 5 нақты ұсыныс беріңіз. Ағымдағы нәтиже: ${percentage.toFixed(0)}%.`
      },
      gesticulation: {
        ru: `Вы эксперт по жестикуляции. Дайте 5 конкретных рекомендаций для развития выразительности жестов учителя. Текущий результат: ${percentage.toFixed(0)}%.`,
        kk: `Сіз ым-ишара бойынша сарапшысыз. 5 нақты ұсыныс беріңіз. Ағымдағы нәтиже: ${percentage.toFixed(0)}%.`
      },
      facial: {
        ru: `Вы эксперт по мимике. Дайте 5 конкретных рекомендаций для улучшения выразительности лица учителя. Текущий результат: ${percentage.toFixed(0)}%.`,
        kk: `Сіз мимика бойынша сарапшысыз. 5 нақты ұсыныс беріңіз. Ағымдағы нәтиже: ${percentage.toFixed(0)}%.`
      },
      speech: {
        ru: `Вы эксперт по речи. Дайте 5 конкретных рекомендаций для улучшения качества речи учителя. Текущий результат: ${percentage.toFixed(0)}%.`,
        kk: `Сіз сөйлеу бойынша сарапшысыз. 5 нақты ұсыныс беріңіз. Ағымдағы нәтиже: ${percentage.toFixed(0)}%.`
      },
      engagement: {
        ru: `Вы эксперт по харизме. Дайте 5 конкретных рекомендаций для развития педагогической харизмы. Текущий результат: ${percentage.toFixed(0)}%.`,
        kk: `Сіз харизма бойынша сарапшысыз. 5 нақты ұсыныс беріңіз. Ағымдағы нәтиже: ${percentage.toFixed(0)}%.`
      }
    };

    const prompt = prompts[metricType as keyof typeof prompts]?.[language === 'kk' ? 'kk' : 'ru'] || prompts.posture.ru;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const recommendations = text.split('\n')
      .filter((line: string) => line.trim().length > 10 && !line.includes('*'))
      .map((line: string) => line.replace(/^[\d\.\-\*]+\s*/, '').trim())
      .slice(0, 7);

    return createCorsResponse(res, 200, { success: true, result: recommendations });
  } catch (error: any) {
    console.error('Enhanced recommendations generation failed:', error);
    return createCorsResponse(res, 500, { success: false, error: error.message });
  }
}

async function handleConnectionTest(res: VercelResponse, model: any) {
  try {
    const result = await model.generateContent("Ответьте 'OK' если вы работаете корректно.");
    const response = await result.response;
    const text = response.text();
    return createCorsResponse(res, 200, { success: true, message: 'Gemini AI connection successful', response: text.trim() });
  } catch (error: any) {
    console.error('Gemini connection test failed:', error);
    return createCorsResponse(res, 200, { success: false, message: `Connection failed: ${error.message}` });
  }
}