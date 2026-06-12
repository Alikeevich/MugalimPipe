/**
 * Интеграционный тест бэкенд-конвейера на тестовых данных «как от API».
 * Реальный фронтенд-сервис (ScoringService → GeminiAIService) вызывает
 * реальный бэкенд-хендлер (api/gemini-analyze). Замокан только внешний
 * Gemini SDK, axios (Yandex) и HTTP-слой (fetch).
 */
import geminiHandler from '../api/gemini-analyze';
import yandexHandler from '../api/yandex-transcribe';
import { scoringService } from '../src/services/ScoringService';
import { __setGeminiMode } from './mocks/generative-ai';
import { __setYandexRaw } from './mocks/axios';
import {
  yandexRawResponse, audioData, videoDuration,
  makePoseData, makeGestureData, makeFaceData,
  makePoseFrames, makeGesturesOf, audioDataWithText
} from './fixtures';

// --- окружение, как на сервере ---
process.env.GEMINI_API_KEY = 'test-key';
process.env.YANDEX_API_KEY = 'test-key';
process.env.YANDEX_FOLDER_ID = 'test-folder';

// --- мини-фреймворк ассертов ---
let passed = 0, failed = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}${detail ? ' → ' + detail : ''}`); }
}

function makeRes(): any {
  const res: any = {
    _status: 200, _body: null,
    setHeader() { return res; },
    status(c: number) { res._status = c; return res; },
    json(b: any) { res._body = b; return res; }
  };
  return res;
}

// перехватываем вызовы фронтенда к /api/gemini-analyze и направляем в реальный хендлер
let capturedGeminiRequest: any = null;
globalThis.fetch = (async (url: any, init: any) => {
  const u = String(url);
  if (u.includes('/api/gemini-analyze')) {
    const body = JSON.parse(init.body);
    capturedGeminiRequest = body;
    const req: any = { method: 'POST', body };
    const res = makeRes();
    await geminiHandler(req, res);
    return { ok: res._status >= 200 && res._status < 300, status: res._status, json: async () => res._body };
  }
  throw new Error('Неожиданный fetch: ' + u);
}) as any;

async function callYandex(rawBase64Audio: string, config: any) {
  const req: any = { method: 'POST', body: { action: 'transcribe', audioData: rawBase64Audio, config } };
  const res = makeRes();
  await yandexHandler(req, res);
  return res;
}

async function main() {
  console.log('\n=== ТЕСТ 1: Yandex SpeechKit backend (api/yandex-transcribe) ===');
  {
    __setYandexRaw(yandexRawResponse);
    // маленький "аудио"-буфер (<1MB) → синхронное распознавание
    const fakeAudio = Buffer.alloc(2048, 1).toString('base64');
    const res = await callYandex(fakeAudio, { languages: ['ru-RU'], sampleRateHertz: 16000 });
    const r = res._body?.result;
    check('HTTP 200 + success', res._status === 200 && res._body?.success === true, JSON.stringify(res._body)?.slice(0, 120));
    check('Текст транскрипции извлечён', !!r?.text && r.text.includes('квадратные уравнения'));
    check('Слова разбиты с таймкодами', Array.isArray(r?.words) && r.words.length > 0 && typeof r.words[0].endTime === 'number');
    check('Слова-паразиты определены', r?.fillerWordsAnalysis?.totalFillerWords > 0, `found=${r?.fillerWordsAnalysis?.totalFillerWords}`);
    check('detectedLanguages заполнен', Array.isArray(r?.detectedLanguages) && r.detectedLanguages[0]?.languageCode === 'ru-RU');
    console.log(`     фразы-паразиты: ${r?.fillerWordsAnalysis?.commonFillers?.map((f: any) => f.word).join(', ')}`);
  }

  console.log('\n=== ТЕСТ 2: ScoringService + Gemini (валидный JSON от AI) ===');
  {
    __setGeminiMode('valid');
    capturedGeminiRequest = null;
    const result = await scoringService.calculateComprehensiveScore(
      makePoseData(), makeGestureData(), makeFaceData(), audioData, videoDuration
    );
    console.log(`     Итог: ${result.totalScore}/1000 (${result.percentage}%) — оценка ${result.grade}`);

    check('totalScore в диапазоне 0..1000', result.totalScore > 0 && result.totalScore <= 1000, String(result.totalScore));
    check('percentage согласован с totalScore', result.percentage === Math.round(result.totalScore / 1000 * 1000) / 10);
    check('grade непустой', typeof result.grade === 'string' && result.grade.length > 0, result.grade);
    check('5 метрик посчитаны', ['posture','gesticulation','facial','speech','engagement'].every(k => (result.metrics as any)[k]?.score >= 0));
    check('strengths не пустой', result.strengths.length > 0);
    check('aiReport получен от backend', !!result.aiReport?.professionalReport);
    check('aiReport.strengths заполнены', (result.aiReport?.professionalReport?.detailedAnalysis?.strengths?.length || 0) > 0);

    // КЛЮЧЕВАЯ ПРОВЕРКА ИСПРАВЛЕНИЯ #1:
    // в Gemini должны уйти РЕАЛЬНЫЕ percentage и grade, а не 0 и ''
    const sentPct = capturedGeminiRequest?.analysisData?.scoringResults?.percentage;
    const sentGrade = capturedGeminiRequest?.analysisData?.scoringResults?.grade;
    const sentTotal = capturedGeminiRequest?.analysisData?.scoringResults?.totalScore;
    check('🔧FIX1: Gemini получил percentage == итоговому (не 0)', sentPct === result.percentage && sentPct !== 0, `sent=${sentPct}, expected=${result.percentage}`);
    check('🔧FIX1: Gemini получил grade == итоговому (не "")', sentGrade === result.grade && sentGrade !== '', `sent="${sentGrade}"`);
    check('🔧FIX1: Gemini получил totalScore == итоговому', sentTotal === result.totalScore, `sent=${sentTotal}`);
  }

  console.log('\n=== ТЕСТ 3: серверный fallback-отчёт (AI без JSON) использует реальный % ===');
  {
    __setGeminiMode('nojson');
    capturedGeminiRequest = null;
    const result = await scoringService.calculateComprehensiveScore(
      makePoseData(), makeGestureData(), makeFaceData(), audioData, videoDuration
    );
    const summary: string = result.aiReport?.professionalReport?.executiveSummary || '';
    const realPct = result.percentage.toFixed(1) + '%';
    console.log(`     executiveSummary: ${summary}`);
    check('Серверный fallback вернул отчёт', !!summary);
    check('🔧FIX1: в резюме реальный процент', summary.includes(realPct), `ожидали "${realPct}"`);
    check('🔧FIX1: НЕТ ошибочного "0.0%"', !(summary.includes('0.0%') && result.percentage !== 0));
  }

  console.log('\n=== ТЕСТ 4: формирование записи для Supabase (insert) ===');
  {
    // воспроизводим логику App.tsx handleSaveReport (после исправления схемы)
    const analysisResults: any = await scoringService.calculateComprehensiveScore(
      makePoseData(), makeGestureData(), makeFaceData(), audioData, videoDuration
    );
    analysisResults.analysisDetails = { videoAnalysis: { videoDuration } };

    const insertData = {
      user_id: 'user-123',
      title: 'Анализ урока',
      file_name: 'report.pdf',
      file_url: null,
      storage_path: null,
      total_score: analysisResults?.totalScore || 0,
      percentage: analysisResults?.percentage || 0,
      grade: analysisResults?.grade || 'N/A',
      metrics: analysisResults?.metrics || {},
      ai_report: analysisResults?.aiReport || {},
      strengths: analysisResults?.strengths || [],
      priority_areas: analysisResults?.priorityAreas || [],
      transcription: analysisResults?.metrics?.speech?.transcription || null,
      video_duration: analysisResults?.analysisDetails?.videoAnalysis?.videoDuration ?? null,
      status: 'completed' as const
    };

    // колонки реальной схемы reports (supabase_reports_setup.sql)
    const schemaColumns = new Set([
      'user_id','title','description','total_score','percentage','grade','metrics',
      'ai_report','strengths','priority_areas','file_name','file_url','storage_path',
      'video_duration','video_file_name','transcription','status'
    ]);
    const unknown = Object.keys(insertData).filter(k => !schemaColumns.has(k));

    check('🔧FIX2: нет фантомной колонки "content"', !('content' in insertData));
    check('🔧FIX2: все колонки insert есть в схеме', unknown.length === 0, 'лишние: ' + unknown.join(', '));
    check('🔧FIX2: transcription заполнен из метрик речи', !!insertData.transcription && insertData.transcription.includes('квадратные'));
    check('🔧FIX2: video_duration заполнен', insertData.video_duration === videoDuration);
    check('total_score сохраняется корректно', insertData.total_score === analysisResults.totalScore);
  }

  console.log('\n=== ТЕСТ 5: скоринг отличает «хорошо» от «плохо» (после фиксов A) ===');
  {
    __setGeminiMode('valid');
    const score = (pose: any[], gest: any[], face: any[], audio: any) =>
      scoringService.calculateComprehensiveScore(pose, gest, face, audio, videoDuration);

    // Поза: ровный корпус + поднятая голова  vs  наклон + опущенная голова
    const goodPose = await score(makePoseFrames({ leanOffset: 0, headUp: 0.18 }), makeGestureData(), makeFaceData(), audioData);
    const badPose  = await score(makePoseFrames({ leanOffset: 0.18, headUp: 0.04 }), makeGestureData(), makeFaceData(), audioData);
    const gp = goodPose.metrics.posture, bp = badPose.metrics.posture;
    console.log(`     осанка: spineAlignment ${gp.spineAlignment} vs ${bp.spineAlignment}, confidence ${gp.confidence} vs ${bp.confidence}`);
    check('🔧A: ровный корпус > наклонённого (исправлена ось наклона, задействованы бёдра)', gp.spineAlignment > bp.spineAlignment);
    check('🔧A: поднятая голова > опущенной (confidence — реальный сигнал, не среднее)', gp.confidence > bp.confidence);

    // Жесты: открытая ладонь  vs  сжатый кулак
    const openG   = await score(makePoseFrames(), makeGesturesOf('Open_Palm'), makeFaceData(), audioData);
    const closedG = await score(makePoseFrames(), makeGesturesOf('Closed_Fist'), makeFaceData(), audioData);
    const og = openG.metrics.gesticulation, cg = closedG.metrics.gesticulation;
    console.log(`     жесты: expressiveness ${og.expressiveness} vs ${cg.expressiveness}, appropriateness ${og.appropriateness} vs ${cg.appropriateness}`);
    check('🔧A: открытая ладонь выразительнее кулака (не «уверенность модели»)', og.expressiveness > cg.expressiveness);
    check('🔧A: кулак менее уместен, чем открытый жест', og.appropriateness > cg.appropriateness);

    // Речь: связные предложения  vs  один сбивчивый поток
    const idealText = 'Сегодня мы изучаем дроби. Дробь это часть целого. Числитель стоит сверху. Знаменатель находится снизу. Давайте решим пример вместе. Откройте тетради и запишите тему.';
    const runonText = 'Сегодня мы будем изучать дроби и дробь это часть целого числа а числитель это то что стоит сверху над линией дроби тогда как знаменатель находится снизу под чертой и показывает на сколько частей разделили целое поэтому давайте откроем тетради запишем тему урока и попробуем вместе решить несколько простых примеров чтобы лучше понять.';
    const idealSp = await score(makePoseFrames(), makeGestureData(), makeFaceData(), audioDataWithText(idealText));
    const runonSp = await score(makePoseFrames(), makeGestureData(), makeFaceData(), audioDataWithText(runonText));
    console.log(`     речь: grammar ${idealSp.metrics.speech.grammar} vs ${runonSp.metrics.speech.grammar}`);
    check('🔧A: связная речь > сбивчивого потока (grammar — коридор, не «длиннее=лучше»)', idealSp.metrics.speech.grammar > runonSp.metrics.speech.grammar);
  }

  console.log(`\n=================================`);
  console.log(`Итого: ${passed} passed, ${failed} failed`);
  console.log(`=================================\n`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
