// Мок Google Generative AI SDK для тестов.
// Режимы: 'valid' — вернуть валидный JSON; 'nojson' — текст без JSON
// (→ серверный createFallbackReport); 'throw' — упасть (→ клиентский fallback).
let mode: 'valid' | 'nojson' | 'throw' = 'valid';
export function __setGeminiMode(m: 'valid' | 'nojson' | 'throw') { mode = m; }

export class GoogleGenerativeAI {
  constructor(_apiKey: string) {}
  getGenerativeModel(_cfg: any) {
    return {
      async generateContent(_prompt: string) {
        if (mode === 'throw') {
          throw new Error('Mock Gemini failure');
        }
        if (mode === 'nojson') {
          return { response: { text: () => 'Анализ урока завершён, но без структурированного ответа.' } };
        }
        const payload = {
          executiveSummary: 'Учитель уверенно начал урок и чётко объяснил тему.',
          detailedAnalysis: {
            strengths: ['Чёткая дикция', 'Уверенная поза', 'Хороший контакт'],
            areasForImprovement: ['Сократить слова-паразиты', 'Добавить пауз'],
            keyInsights: ['Сильное вступление', 'Стабильный темп']
          },
          recommendations: {
            immediate: ['Делать паузы вместо "ну"'],
            shortTerm: ['Тренировать жесты'],
            longTerm: ['Курс ораторского мастерства']
          },
          actionPlan: {
            week1: ['Запись урока'], week2: ['Жесты'], week3: ['Мимика'], week4: ['Анализ']
          },
          motivationalMessage: 'Отличная работа, продолжайте!',
          nextSteps: ['Выбрать 3 цели', 'Записать видео']
        };
        const text = 'Вот профессиональный отчёт:\n```json\n' + JSON.stringify(payload) + '\n```';
        return { response: { text: () => text } };
      }
    };
  }
}
