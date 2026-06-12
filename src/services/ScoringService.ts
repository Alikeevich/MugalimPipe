import { geminiAIService, type GeminiAnalysisRequest } from './GeminiAIService';
import { languageService } from './LanguageService';
import { SCORING_CONFIG as CFG, COMPONENT_MAX, clamp01 } from './ScoringConfig';

export interface DetailedMetrics {
  posture: PostureMetrics;
  gesticulation: GesticulationMetrics;
  facial: FacialMetrics;
  speech: SpeechMetrics;
  engagement: EngagementMetrics;
}

export interface PostureMetrics {
  score: number;
  maxScore: 200;
  spineAlignment: number;
  shoulderSymmetry: number;
  headPosition: number;
  stability: number;
  confidence: number;
  issues: string[];
  recommendations: string[];
  aiRecommendations?: string[];
}

export interface GesticulationMetrics {
  score: number;
  maxScore: 200;
  variety: number;
  frequency: number;
  appropriateness: number;
  expressiveness: number;
  coordination: number;
  gestures: string[];
  recommendations: string[];
  aiRecommendations?: string[];
}

export interface FacialMetrics {
  score: number;
  maxScore: 200;
  expressiveness: number;
  eyeContact: number;
  smileFrequency: number;
  emotionalRange: number;
  authenticity: number;
  expressions: string[];
  recommendations: string[];
  aiRecommendations?: string[];
}

export interface SpeechMetrics {
  score: number;
  maxScore: 200;
  clarity: number;
  pace: number;
  volume: number;
  vocabulary: number;
  grammar: number;
  fillerWords: number;
  transcription: string;
  recommendations: string[];
  aiRecommendations?: string[];
}

export interface EngagementMetrics {
  score: number;
  maxScore: 200;
  attention: number;
  interaction: number;
  energy: number;
  presence: number;
  charisma: number;
  recommendations: string[];
  aiRecommendations?: string[];
}

export interface ComprehensiveAnalysis {
  totalScore: number;
  maxTotalScore: 1000;
  percentage: number;
  grade: string;
  metrics: DetailedMetrics;
  overallFeedback: string;
  priorityAreas: string[];
  strengths: string[];
  improvementPlan: string[];
  aiReport?: {
    professionalReport: any;
    enhancedRecommendations: any;
    motivationalMessage: string;
    nextSteps: string[];
  };
}

class ScoringService {
  async calculateComprehensiveScore(
    poseData: any[],
    gestureData: any[],
    faceData: any[],
    audioData: any,
    videoDuration: number
  ): Promise<ComprehensiveAnalysis> {
    
    if (!videoDuration || videoDuration <= 0 || isNaN(videoDuration)) {
      console.warn('Invalid video duration, using fallback values');
      return this.getFallbackAnalysis();
    }
    
    const postureMetrics = this.analyzePostureMetrics(poseData);
    const gesticulationMetrics = this.analyzeGesticulationMetrics(gestureData, videoDuration);
    const facialMetrics = this.analyzeFacialMetrics(faceData);
    const speechMetrics = this.analyzeSpeechMetrics(audioData, videoDuration);
    const engagementMetrics = this.analyzeEngagementMetrics(
      poseData, gestureData, faceData, audioData, videoDuration
    );

    const metrics: DetailedMetrics = {
      posture: postureMetrics,
      gesticulation: gesticulationMetrics,
      facial: facialMetrics,
      speech: speechMetrics,
      engagement: engagementMetrics
    };

    // Считаем итоговый балл, процент и оценку ДО запроса в AI,
    // чтобы Gemini получил реальные значения, а не нули.
    const rawTotal = postureMetrics.score + gesticulationMetrics.score +
                     facialMetrics.score + speechMetrics.score + engagementMetrics.score;
    const safeTotal = Number.isFinite(rawTotal) ? Math.round(rawTotal) : 0;
    const safePct   = Number.isFinite(safeTotal / 1000 * 100)
                      ? Math.round((safeTotal / 1000) * 1000) / 10
                      : 0;
    const grade = this.calculateGrade(safePct);

    let aiReport;
    try {
      console.log('🤖 Generating AI-enhanced professional report...');
      const geminiRequest: GeminiAnalysisRequest = {
        transcription: speechMetrics.transcription,
        videoAnalysis: { videoDuration },
        audioAnalysis: audioData,
        scoringResults: {
          totalScore: safeTotal,
          percentage: safePct,
          grade,
          metrics
        },
        multilingualData: audioData.transcriptionMetadata?.isMultilingual ? {
          detectedLanguages: audioData.transcriptionMetadata.detectedLanguages,
          isMultilingual: audioData.transcriptionMetadata.isMultilingual,
          languageSwitches: audioData.transcriptionMetadata.languageSwitches,
          dominantLanguage: audioData.transcriptionMetadata.detectedLanguages?.[0]?.languageCode
        } : undefined,
        userLanguage: languageService.getCurrentLanguage()
      };

      aiReport = await geminiAIService.generateProfessionalReport(geminiRequest);
      console.log('✅ AI-enhanced analysis completed');
    } catch (error) {
      console.error('❌ AI analysis failed, using fallback:', error);
      aiReport = undefined;
    }

    return {
      totalScore: safeTotal,
      maxTotalScore: 1000,
      percentage: safePct,
      grade,
      metrics,
      overallFeedback: this.generateOverallFeedback(safePct),
      strengths: this.identifyStrengths(metrics),
      priorityAreas: this.identifyPriorityAreas(metrics),
      improvementPlan: this.generateImprovementPlan(metrics),
      aiReport
    };
  }

  private identifyStrengths(metrics: DetailedMetrics): string[] {
    const strengths: string[] = [];

    if (metrics.posture.score >= 140) {
      if (metrics.posture.spineAlignment >= 35) strengths.push('Прямая осанка на протяжении урока');
      if (metrics.posture.shoulderSymmetry >= 35) strengths.push('Симметричное положение плеч');
      if (metrics.posture.confidence >= 35) strengths.push('Уверенная поза преподавателя');
    }
    if (metrics.gesticulation.score >= 140) {
      if (metrics.gesticulation.variety >= 35) strengths.push('Разнообразные жесты');
      if (metrics.gesticulation.expressiveness >= 35) strengths.push('Выразительная жестикуляция');
      if (metrics.gesticulation.coordination >= 35) strengths.push('Координированные движения руками');
    }
    if (metrics.facial.score >= 140) {
      if (metrics.facial.eyeContact >= 35) strengths.push('Хороший зрительный контакт с аудиторией');
      if (metrics.facial.expressiveness >= 35) strengths.push('Выразительная мимика');
      if (metrics.facial.smileFrequency >= 35) strengths.push('Частые улыбки');
    }
    if (metrics.speech.score >= 140) {
      if (metrics.speech.clarity >= 35) strengths.push('Четкая дикция');
      if (metrics.speech.vocabulary >= 35) strengths.push('Богатый словарный запас');
      if (metrics.speech.grammar >= 35) strengths.push('Грамотная речь');
      if (metrics.speech.volume >= 35) strengths.push('Уверенный, хорошо слышимый голос');
    }
    if (metrics.engagement.score >= 140) {
      if (metrics.engagement.energy >= 35) strengths.push('Энергичная подача материала');
      if (metrics.engagement.charisma >= 35) strengths.push('Харизматичное присутствие');
      if (metrics.engagement.attention >= 35) strengths.push('Внимательное отношение к аудитории');
    }

    if (strengths.length === 0) {
      if (metrics.posture.score >= 100) strengths.push('Стабильная поза');
      if (metrics.gesticulation.score >= 100) strengths.push('Использование жестов');
      if (metrics.facial.score >= 100) strengths.push('Эмоциональная вовлеченность');
      if (metrics.speech.score >= 100) strengths.push('Понятная речь');
      if (metrics.engagement.score >= 100) strengths.push('Вовлеченность в процесс');
    }

    if (strengths.length === 0) {
      strengths.push('Понимание материала урока', 'Стремление к развитию', 'Работа над собой');
    }

    return strengths.slice(0, 5);
  }

  private identifyPriorityAreas(metrics: DetailedMetrics): string[] {
    const areas: string[] = [];

    if (metrics.posture.score < 120) {
      if (metrics.posture.spineAlignment < 30) areas.push('Работать над выравниванием позвоночника');
      if (metrics.posture.shoulderSymmetry < 30) areas.push('Контролировать симметрию плеч');
      if (metrics.posture.headPosition < 30) areas.push('Держать голову прямо');
      if (metrics.posture.stability < 30) areas.push('Уменьшить избыточные движения');
    }
    if (metrics.gesticulation.score < 120) {
      if (metrics.gesticulation.variety < 30) areas.push('Разнообразить жесты');
      if (metrics.gesticulation.frequency < 30) areas.push('Добавить больше жестов');
      if (metrics.gesticulation.expressiveness < 30) areas.push('Улучшить выразительность жестов');
    }
    if (metrics.facial.score < 120) {
      if (metrics.facial.eyeContact < 30) areas.push('Поддерживать зрительный контакт');
      if (metrics.facial.smileFrequency < 30) areas.push('Чаще улыбаться');
      if (metrics.facial.expressiveness < 30) areas.push('Развивать эмоциональную выразительность');
    }
    if (metrics.speech.score < 120) {
      if (metrics.speech.clarity < 30) areas.push('Работать над четкостью речи');
      if (metrics.speech.pace < 30) areas.push('Контролировать темп речи');
      if (metrics.speech.volume < 25) areas.push('Говорить увереннее и громче');
      if (metrics.speech.fillerWords > 5) areas.push('Сократить слова-паразиты');
    }
    if (metrics.engagement.score < 120) {
      if (metrics.engagement.energy < 30) areas.push('Добавить энергии в подачу');
      if (metrics.engagement.charisma < 30) areas.push('Развивать харизму');
      if (metrics.engagement.interaction < 30) areas.push('Взаимодействовать с аудиторией');
    }

    if (areas.length === 0) {
      if (metrics.posture.score < 160) areas.push('Продолжать работать над осанкой');
      if (metrics.gesticulation.score < 160) areas.push('Совершенствовать жестикуляцию');
      if (metrics.facial.score < 160) areas.push('Развивать мимику');
      if (metrics.speech.score < 160) areas.push('Улучшать речь');
    }
    if (areas.length === 0) {
      areas.push('Продолжать профессиональное развитие', 'Изучать новые методики преподавания');
    }

    return areas.slice(0, 5);
  }

  private analyzePostureMetrics(poseData: any[]): PostureMetrics {
    if (poseData.length === 0) {
      return {
        score: 50, maxScore: 200,
        spineAlignment: 10, shoulderSymmetry: 10, headPosition: 10, stability: 10, confidence: 10,
        issues: ["Недостаточно данных о позе"],
        recommendations: ["Убедитесь, что камера захватывает всю фигуру"]
      };
    }

    const C = CFG.posture;
    const issues: string[] = [];
    // Счётчики «плохих» кадров + накопители для усреднения.
    let leanCount = 0, shoulderAsymmetryCount = 0, headOffCount = 0;
    let movementSum = 0, movementFrames = 0;
    let headUpSum = 0, validFrames = 0;

    poseData.forEach((frame, index) => {
      if (!frame?.landmarks || !Array.isArray(frame.landmarks) || frame.landmarks.length < 25) return;
      const landmarks = frame.landmarks;
      const nose = landmarks[0], leftShoulder = landmarks[11], rightShoulder = landmarks[12],
            leftHip = landmarks[23], rightHip = landmarks[24];

      if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return;
      if (typeof nose.x !== 'number' || typeof leftShoulder.x !== 'number' ||
          typeof rightShoulder.x !== 'number' ||
          typeof leftHip.x !== 'number' || typeof rightHip.x !== 'number') return;

      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      validFrames++;

      // 1) Наклон корпуса: плечи должны стоять над бёдрами (любая сторона). Используем бёдра.
      if (Math.abs(shoulderCenter.x - hipCenter.x) > C.torsoLeanThreshold) leanCount++;
      // 2) Симметрия плеч: разница их высоты.
      if (Math.abs(leftShoulder.y - rightShoulder.y) > C.shoulderLevelThreshold) shoulderAsymmetryCount++;
      // 3) Положение головы: смещение носа от центра плеч по горизонтали.
      if (Math.abs(nose.x - shoulderCenter.x) > C.headCenterThreshold) headOffCount++;
      // 5) Уверенность: насколько голова поднята над плечами (нос выше → меньше y).
      headUpSum += (shoulderCenter.y - nose.y);

      // 4) Стабильность: смещение носа между соседними кадрами.
      if (index > 0) {
        const prevNose = poseData[index - 1]?.landmarks?.[0];
        if (prevNose && typeof prevNose.x === 'number') {
          movementSum += Math.sqrt(
            Math.pow(nose.x - prevNose.x, 2) + Math.pow(nose.y - prevNose.y, 2)
          );
          movementFrames++;
        }
      }
    });

    const fc = Math.max(1, validFrames);
    const leanRatio   = leanCount / fc;
    const asymRatio   = shoulderAsymmetryCount / fc;
    const headOffRatio = headOffCount / fc;
    const avgMovement = movementFrames > 0 ? movementSum / movementFrames : 0;
    const avgHeadUp   = headUpSum / fc;

    const spineAlignmentScore  = COMPONENT_MAX * (1 - leanRatio);
    const shoulderSymmetryScore = COMPONENT_MAX * (1 - asymRatio);
    const headPositionScore    = COMPONENT_MAX * (1 - headOffRatio);
    const stabilityScore       = Math.max(0, COMPONENT_MAX - avgMovement * C.movementPenaltyPerUnit);
    // Уверенность: голова поднята над плечами на headUpIdeal → 40, на headUpMin и ниже → 0.
    const confidenceScore = COMPONENT_MAX *
      clamp01((avgHeadUp - C.headUpMin) / (C.headUpIdeal - C.headUpMin));

    if (leanRatio    > C.issue.lean)      issues.push("Наклоны корпуса");
    if (asymRatio    > C.issue.shoulders) issues.push("Асимметрия плеч");
    if (headOffRatio > C.issue.head)      issues.push("Голова отклонена в сторону");
    if (avgMovement  > C.issue.movement)  issues.push("Избыточные движения");

    const totalScore = spineAlignmentScore + shoulderSymmetryScore +
                       headPositionScore + stabilityScore + confidenceScore;

    return {
      score: Math.round(totalScore), maxScore: 200,
      spineAlignment: Math.round(spineAlignmentScore),
      shoulderSymmetry: Math.round(shoulderSymmetryScore),
      headPosition: Math.round(headPositionScore),
      stability: Math.round(stabilityScore),
      confidence: Math.round(confidenceScore),
      issues,
      recommendations: this.generatePostureRecommendations(issues, totalScore)
    };
  }

  private analyzeGesticulationMetrics(gestureData: any[], videoDuration: number): GesticulationMetrics {
    if (gestureData.length === 0) {
      return {
        score: 60, maxScore: 200,
        variety: 20, frequency: 20, appropriateness: 20, expressiveness: 20, coordination: 20,
        gestures: [],
        recommendations: ["Добавьте больше жестов для выразительности"]
      };
    }

    const C = CFG.gesticulation;
    const gestureTypes = new Set<string>();
    const gestureTimestamps: number[] = [];
    let totalGestures = 0, openGesturesCount = 0, negativeGesturesCount = 0;

    gestureData.forEach(frame => {
      frame.gestures.forEach((handGestures: any[]) => {
        handGestures.forEach((gesture: any) => {
          if (gesture.score > C.minGestureConfidence) {
            gestureTypes.add(gesture.categoryName);
            gestureTimestamps.push(frame.timestamp);
            totalGestures++;
            // Выразительность: открытые жесты к аудитории (а не «уверенность модели»).
            if (C.expressiveGestures.includes(gesture.categoryName)) openGesturesCount++;
            // Уместность снижают только закрытые/негативные жесты.
            if (C.negativeGestures.includes(gesture.categoryName)) negativeGesturesCount++;
          }
        });
      });
    });

    const gestureFrequency = isNaN(totalGestures / videoDuration) ? 0 : totalGestures / videoDuration;
    // Доля открытых/выразительных жестов.
    const expressivenessRatio  = totalGestures > 0 ? openGesturesCount / totalGestures : 0;
    // Уместность = доля НЕ-негативных жестов (всё, кроме закрытого кулака / большого пальца вниз).
    const appropriatenessRatio = totalGestures > 0 ? (totalGestures - negativeGesturesCount) / totalGestures : 0;

    let coordinationScore = COMPONENT_MAX;
    if (gestureTimestamps.length > 1) {
      const intervals = gestureTimestamps.slice(1).map((t, i) => t - gestureTimestamps[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((s, i) => s + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      coordinationScore = Math.max(0, COMPONENT_MAX - variance * C.rhythmPenaltyPerUnit);
    }

    const varietyScore        = Math.min(COMPONENT_MAX, gestureTypes.size * C.varietyPerType);
    const frequencyScore      = Math.min(COMPONENT_MAX, gestureFrequency * C.frequencyMultiplier);
    const appropriatenessScore = appropriatenessRatio * COMPONENT_MAX;
    const expressivenessScore  = expressivenessRatio * COMPONENT_MAX;
    const totalScore = varietyScore + frequencyScore + appropriatenessScore +
                       expressivenessScore + coordinationScore;

    return {
      score: Math.round(totalScore), maxScore: 200,
      variety: Math.round(varietyScore), frequency: Math.round(frequencyScore),
      appropriateness: Math.round(appropriatenessScore),
      expressiveness: Math.round(expressivenessScore),
      coordination: Math.round(coordinationScore),
      gestures: Array.from(gestureTypes),
      recommendations: this.generateGestureRecommendations(gestureTypes.size, gestureFrequency, totalScore)
    };
  }

  private analyzeFacialMetrics(faceData: any[]): FacialMetrics {
    if (faceData.length === 0) {
      return {
        score: 50, maxScore: 200,
        expressiveness: 10, eyeContact: 10, smileFrequency: 10, emotionalRange: 10, authenticity: 10,
        expressions: [],
        recommendations: ["Улучшите освещение для лучшего анализа лица"]
      };
    }

    const C = CFG.facial;
    let smileCount = 0, eyeContactCount = 0, expressiveCount = 0, authenticityScore = 0;
    const emotionalVariety = new Set<string>();

    faceData.forEach(frame => {
      if (!frame.blendshapes?.categories) return;
      const bs = frame.blendshapes.categories;

      const smileShapes = bs.filter((b: any) =>
        b.categoryName.includes('mouthSmile') ||
        b.categoryName.includes('mouthLeft') ||
        b.categoryName.includes('mouthRight')
      );
      const maxSmile = Math.max(...smileShapes.map((b: any) => b.score), 0);
      if (maxSmile > C.smileThreshold) { smileCount++; emotionalVariety.add('smile'); }

      const lookingAway =
        (bs.find((b: any) => b.categoryName.includes('eyeLookDown'))?.score || 0) +
        (bs.find((b: any) => b.categoryName.includes('eyeLookUp'))?.score   || 0) +
        (bs.find((b: any) => b.categoryName.includes('eyeLookLeft'))?.score  || 0) +
        (bs.find((b: any) => b.categoryName.includes('eyeLookRight'))?.score || 0);
      if (lookingAway < C.eyeContactMaxLookAway) eyeContactCount++;

      const browShapes = bs.filter((b: any) => b.categoryName.includes('brow'));
      const maxBrow = Math.max(...browShapes.map((b: any) => b.score), 0);
      if (maxBrow > C.browThreshold) { expressiveCount++; emotionalVariety.add('expressive'); }

      const totalExpr = maxSmile + maxBrow + lookingAway;
      if (totalExpr > C.authenticityMin && totalExpr < C.authenticityMax) authenticityScore++;
    });

    const fc = faceData.length;
    const safeSmile = isNaN(smileCount / fc)         ? 0 : smileCount / fc;
    const safeEye   = isNaN(eyeContactCount / fc)     ? 0 : eyeContactCount / fc;
    const safeExpr  = isNaN(expressiveCount / fc)     ? 0 : expressiveCount / fc;
    const safeAuth  = isNaN(authenticityScore / fc)   ? 0 : authenticityScore / fc;

    const expressivenessScore     = Math.min(COMPONENT_MAX, safeExpr  * C.expressivenessMultiplier);
    const eyeContactScore         = safeEye   * COMPONENT_MAX;
    const smileFrequencyScore     = Math.min(COMPONENT_MAX, safeSmile * C.smileMultiplier);
    const emotionalRangeScoreNorm = Math.min(COMPONENT_MAX, emotionalVariety.size * C.emotionalRangePerType);
    const authenticityScoreNorm   = safeAuth  * COMPONENT_MAX;

    const totalScore = expressivenessScore + eyeContactScore + smileFrequencyScore +
                       emotionalRangeScoreNorm + authenticityScoreNorm;

    return {
      score: Math.round(totalScore), maxScore: 200,
      expressiveness: Math.round(expressivenessScore),
      eyeContact: Math.round(eyeContactScore),
      smileFrequency: Math.round(smileFrequencyScore),
      emotionalRange: Math.round(emotionalRangeScoreNorm),
      authenticity: Math.round(authenticityScoreNorm),
      expressions: Array.from(emotionalVariety),
      recommendations: this.generateFacialRecommendations(safeSmile, safeEye, totalScore)
    };
  }

  // ✅ ХАРДКОД УБРАН: теперь используем реальные данные из audioData
  private analyzeSpeechMetrics(audioData: any, videoDuration: number): SpeechMetrics {
    const transcription = audioData?.transcription || this.generateMockTranscription();

    // \p{L} — буква ЛЮБОГО алфавита (включая кириллицу). Прежний \w вырезал
    // кириллицу целиком, из-за чего словарь и грамматика всегда были 0.
    const words = transcription.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 0);

    const wordCount = words.length;
    const uniqueWordCount = new Set(words).size;

    const wordsPerMinute = audioData?.vocabulary?.speakingRate ??
      (videoDuration > 0 ? (wordCount / videoDuration) * 60 : 0);
    const safeWPM = isNaN(wordsPerMinute) ? 0 : wordsPerMinute;

    const fillerCount = audioData?.vocabulary?.fillerWords ??
      words.filter((w: string) =>
        ['эм','ах','ну','так','значит','короче','типа','как бы','вот','это'].includes(w)
      ).length;
    const fillerRatio = audioData?.vocabulary?.fillerWordsRatio ??
      (wordCount > 0 ? fillerCount / wordCount : 0);

    // Словарное богатство
    const avgWordLength = wordCount > 0
      ? words.reduce((s: number, w: string) => s + w.length, 0) / wordCount
      : 0;
    const vocabularyRichness = wordCount > 0 ? uniqueWordCount / wordCount : 0;

    // Грамматика (средняя длина предложения)
    const sentences = transcription.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;

    // --- Скоринг компонентов (каждый из 40 баллов) ---

    const C = CFG.speech;

    const clarityScore = Math.max(0, COMPONENT_MAX - fillerRatio * C.fillerPenalty);

    // Темп: полный балл в коридоре [paceIdealMin..paceIdealMax],
    // плавный спад при слишком медленной/быстрой речи.
    let paceScore: number;
    if (safeWPM >= C.paceIdealMin && safeWPM <= C.paceIdealMax) {
      paceScore = COMPONENT_MAX;
    } else if (safeWPM < C.paceIdealMin) {
      if (safeWPM <= C.paceSlowFloor) {
        paceScore = (safeWPM / C.paceSlowFloor) * 30;
      } else {
        paceScore = 30 + ((safeWPM - C.paceSlowFloor) / (C.paceIdealMin - C.paceSlowFloor)) * 10;
      }
    } else { // быстрее идеала
      if (safeWPM <= C.paceFastCeil) {
        paceScore = COMPONENT_MAX - ((safeWPM - C.paceIdealMax) / (C.paceFastCeil - C.paceIdealMax)) * 10;
      } else {
        paceScore = Math.max(0, 30 - ((safeWPM - C.paceFastCeil) / 40) * 20);
      }
    }

    const volumeScore = this.calculateVolumeScore(audioData);

    const vocabularyScore = Math.min(COMPONENT_MAX,
      vocabularyRichness * C.richnessMultiplier + avgWordLength * C.wordLengthMultiplier);

    // Связность: оптимальная средняя длина предложения. И слишком короткие
    // (рубленые), и слишком длинные (сбивчивые) предложения снижают балл.
    let grammarScore: number;
    if (avgSentenceLength >= C.sentenceIdealMin && avgSentenceLength <= C.sentenceIdealMax) {
      grammarScore = COMPONENT_MAX;
    } else if (avgSentenceLength < C.sentenceIdealMin) {
      grammarScore = (avgSentenceLength / C.sentenceIdealMin) * COMPONENT_MAX;
    } else {
      grammarScore = Math.max(0, COMPONENT_MAX - (avgSentenceLength - C.sentenceIdealMax) * C.sentenceLongPenalty);
    }

    const totalScore = clarityScore + paceScore + volumeScore + vocabularyScore + grammarScore;

    return {
      score: Math.round(Math.max(0, totalScore)), maxScore: 200,
      clarity: Math.round(Math.max(0, clarityScore)),
      pace: Math.round(Math.max(0, paceScore)),
      volume: Math.round(volumeScore),
      vocabulary: Math.round(Math.max(0, vocabularyScore)),
      grammar: Math.round(Math.max(0, grammarScore)),
      fillerWords: fillerCount,
      transcription,
      recommendations: this.generateSpeechRecommendations(fillerRatio, safeWPM, vocabularyRichness, totalScore)
    };
  }

  /**
   * вычисляем балл громкости из реальных данных AudioBuffer.
   */
  private calculateVolumeScore(audioData: any): number {
    const ch = audioData?.characteristics;
    if (!ch) return 20;

    const C = CFG.speech;
    const rms: number | undefined =
      ch.rms ?? ch.averageAmplitude ?? ch.meanAmplitude ?? ch.avgAmplitude ?? ch.amplitude;

    if (rms === undefined || isNaN(rms)) return C.volumeDefault;

    for (const band of C.volumeBands) {
      if (rms < band.maxRms) return band.score;
    }
    // Перегруз: тихий спад от максимума.
    const lastBand = C.volumeBands[C.volumeBands.length - 1];
    return Math.max(25, COMPONENT_MAX - (rms - lastBand.maxRms) * C.volumeLoudFalloff);
  }

  private analyzeEngagementMetrics(
    poseData: any[], gestureData: any[], faceData: any[],
    audioData: any, videoDuration: number
  ): EngagementMetrics {

    const W = CFG.engagement;

    // Сырые доли (0..1) из разных каналов — единый источник для всех под-параметров.
    const raw: Record<string, number> = {
      poseStability:    poseData.length > 0 ? this.calculatePoseStability(poseData) : 0,
      eyeContact:       faceData.length > 0 ? this.calculateEyeContactRatio(faceData) : 0,
      gestureActivity:  videoDuration > 0 ? Math.min(1, gestureData.length / (videoDuration * W.gestureActivityDivisor)) : 0,
      facialActivity:   videoDuration > 0 ? Math.min(1, faceData.length  / (videoDuration * W.facialActivityDivisor)) : 0,
      speechDynamics:   audioData ? this.calculateSpeechDynamics(audioData) : 0,
      movementDynamics: poseData.length > 0 ? this.calculateMovementDynamics(poseData) : 0,
    };

    // Взвешенная смесь сырых долей → балл под-параметра (веса в конфиге, сумма = 1).
    const blend = (weights: Record<string, number>): number => {
      const v = Object.entries(weights).reduce((s, [k, w]) => s + w * (raw[k] ?? 0), 0);
      return Math.min(COMPONENT_MAX, clamp01(v) * COMPONENT_MAX);
    };

    const attentionScore   = blend(W.weights.attention);
    const interactionScore = blend(W.weights.interaction);
    const energyScore      = blend(W.weights.energy);
    const presenceScore    = blend(W.weights.presence);   // упор на контакт глаз + спокойствие
    const charismaScore    = blend(W.weights.charisma);   // упор на динамику речи + жесты
    const totalScore = attentionScore + interactionScore + energyScore + presenceScore + charismaScore;

    return {
      score: Math.round(totalScore), maxScore: 200,
      attention: Math.round(attentionScore),
      interaction: Math.round(interactionScore),
      energy: Math.round(energyScore),
      presence: Math.round(presenceScore),
      charisma: Math.round(charismaScore),
      recommendations: this.generateEngagementRecommendations(totalScore)
    };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    return 'D';
  }

  private generateOverallFeedback(percentage: number): string {
    if (percentage >= 90) return "Превосходное педагогическое мастерство! Вы демонстрируете высокий уровень профессионализма во всех аспектах преподавания. Ваша харизма, отличная осанка, выразительная жестикуляция и грамотная речь создают идеальную атмосферу для обучения.";
    if (percentage >= 85) return "Отличный результат! Большинство аспектов вашего преподавания на высоком уровне. Сосредоточьтесь на небольших улучшениях в областях с более низкими показателями.";
    if (percentage >= 80) return "Очень хороший уровень преподавания! Есть прочная база педагогических навыков. Рекомендуется работа над отдельными аспектами.";
    if (percentage >= 75) return "Хорошие педагогические навыки с потенциалом для дальнейшего развития. Сосредоточьтесь на приоритетных областях.";
    if (percentage >= 70) return "Уровень выше среднего. Есть хорошие навыки, но некоторые аспекты требуют доработки.";
    if (percentage >= 65) return "Удовлетворительный результат. Базовые навыки есть, но требуется значительная работа над техникой преподавания.";
    if (percentage >= 60) return "Базовый уровень. Вы владеете основами, но многие аспекты требуют улучшения.";
    if (percentage >= 55) return "Начальный уровень. Следуйте плану улучшений и регулярно практикуйтесь.";
    if (percentage >= 50) return "Требуется значительная работа. Рекомендуется интенсивная практика.";
    return "Рекомендуется интенсивная работа над базовыми навыками осанки, речи и жестикуляции.";
  }

  private generateImprovementPlan(metrics: DetailedMetrics): string[] {
    const plan: string[] = [];

    if (metrics.posture.score < 100) {
      plan.push("Критично: Ежедневные упражнения для осанки (планка, стенка) — 15 мин/день");
      plan.push("Контролируйте положение спины во время урока");
    } else if (metrics.posture.score < 140) {
      plan.push("Неделя 1-2: Упражнения для укрепления мышц спины (10 мин/день)");
      plan.push("Практикуйте 'королевскую позу' — стойте прямо, плечи расправлены");
    } else if (metrics.posture.score < 160) {
      plan.push("Неделя 1: Лёгкая разминка перед уроком для тонуса мышц");
    }

    if (metrics.gesticulation.score < 100) {
      plan.push("Критично: Изучите базовые педагогические жесты");
      plan.push("Практикуйтесь перед зеркалом — 15 мин ежедневно");
    } else if (metrics.gesticulation.score < 140) {
      plan.push("Неделя 2-3: Тренировка жестикуляции перед зеркалом (10 мин/день)");
      plan.push("Используйте указывающие жесты для акцентирования ключевых моментов");
    } else if (metrics.gesticulation.score < 160) {
      plan.push("Неделя 2: Добавьте больше выразительных жестов");
    }

    if (metrics.facial.score < 100) {
      plan.push("Критично: Работайте над выразительностью лица перед зеркалом");
    } else if (metrics.facial.score < 140) {
      plan.push("Неделя 4-5: Упражнения для мимики и зрительного контакта");
      plan.push("Практикуйте 'технику маяка' — переводите взгляд между частями аудитории");
    } else if (metrics.facial.score < 160) {
      plan.push("Неделя 3: Работайте над эмоциональным диапазоном");
    }

    if (metrics.speech.score < 100) {
      plan.push("Критично: Работа с логопедом или диктором для улучшения дикции");
      plan.push("Полностью исключите слова-паразиты");
    } else if (metrics.speech.score < 140) {
      plan.push("Неделя 2-3: Практика дикции — скороговорки (10 мин/день)");
      plan.push("Контролируйте темп речи — делайте паузы между важными мыслями");
      plan.push("Расширяйте словарный запас через чтение профессиональной литературы");
    } else if (metrics.speech.score < 160) {
      plan.push("Неделя 2: Чтение вслух для улучшения артикуляции");
    }

    if (metrics.speech.volume < 25) {
      plan.push("Работайте над силой голоса — диафрагменное дыхание и вокальные упражнения");
    }

    if (metrics.engagement.score < 100) {
      plan.push("Критично: Увеличьте энергию подачи и добавьте интерактив");
    } else if (metrics.engagement.score < 140) {
      plan.push("Неделя 5-6: Практика интерактивных техник преподавания");
      plan.push("Варьируйте тон голоса и темп речи для удержания внимания");
    } else if (metrics.engagement.score < 160) {
      plan.push("Неделя 4: Развивайте харизму через практику");
    }

    plan.push("");
    plan.push("Еженедельно: Запись и анализ 10-минутных уроков для отслеживания прогресса");
    plan.push("Раз в 2 недели: Сравнение результатов для оценки улучшений");

    return plan;
  }

  // ───────────────── вспомогательные методы ─────────────────

  private generatePostureRecommendations(issues: string[], score: number): string[] {
    const r: string[] = [];
    if (issues.includes("Частые наклоны вперед")) {
      r.push("Держите спину прямо, представьте нить, тянущую вас вверх за макушку");
      r.push("Укрепляйте мышцы кора — это основа правильной осанки");
    }
    if (issues.includes("Асимметрия плеч")) {
      r.push("Выполняйте упражнения для выравнивания плеч у стены");
      r.push("Проверяйте симметрию в зеркале перед уроком");
    }
    if (issues.includes("Наклоны головы")) r.push("Держите голову прямо, взгляд на уровне горизонта");
    if (issues.includes("Избыточные движения")) r.push("Двигайтесь по аудитории осознанно, избегайте покачиваний");
    if (score < 100)  r.push("Практикуйте упражнение 'стенка' — 5 мин в день");
    else if (score < 140) r.push("Рассмотрите занятия йогой или пилатесом 2-3 раза в неделю");
    return r;
  }

  private generateGestureRecommendations(variety: number, frequency: number, score: number): string[] {
    const r: string[] = [];
    if (variety < 2)    r.push("Изучите базовые педагогические жесты (открытые ладони, указывающие)");
    if (frequency < 0.3) r.push("Увеличьте частоту жестикуляции для большей выразительности");
    if (frequency > 2)  r.push("Уменьшите частоту жестов, делайте их более осмысленными");
    if (score < 100)    r.push("Практикуйтесь перед зеркалом ежедневно по 15 минут");
    else if (score < 140) r.push("Смотрите выступления TED и перенимайте жесты спикеров");
    return r;
  }

  private generateFacialRecommendations(smileRatio: number, eyeContactRatio: number, score: number): string[] {
    const r: string[] = [];
    if (smileRatio < 0.2)       r.push("Чаще улыбайтесь — начинайте урок с улыбки");
    if (eyeContactRatio < 0.4)  r.push("Используйте технику 'маяка' — смотрите на разных учеников 3-5 секунд");
    if (score < 100)            r.push("Записывайте себя для анализа мимики");
    else if (score < 140)       r.push("Развивайте эмоциональный интеллект через наблюдение за актёрами");
    return r;
  }

  private generateSpeechRecommendations(
    fillerRatio: number, wpm: number, vocabularyRichness: number, score: number
  ): string[] {
    const r: string[] = [];
    if (fillerRatio > 0.1)      r.push("Критично: делайте осознанные паузы вместо 'эм', 'ах', 'ну'");
    else if (fillerRatio > 0.05) r.push("Работайте над устранением слов-паразитов");
    if (wpm < 100)              r.push("Увеличьте темп речи для большей динамичности");
    if (wpm > 200)              r.push("Замедлите темп речи для лучшего понимания");
    if (vocabularyRichness < 0.5) r.push("Расширяйте словарный запас, избегайте повторов");
    if (score < 100)            r.push("Практикуйте чтение вслух — 20 мин/день");
    else if (score < 140)       r.push("Практикуйте скороговорки для улучшения артикуляции");
    return r;
  }

  private generateEngagementRecommendations(score: number): string[] {
    const r: string[] = [];
    if (score < 100) {
      r.push("Критично: Увеличьте энергичность подачи материала");
      r.push("Используйте больше интерактивных элементов (вопросы, задания)");
    } else if (score < 140) {
      r.push("Варьируйте тон голоса и темп речи для удержания внимания");
      r.push("Используйте риторические вопросы для вовлечения");
      r.push("Добавляйте истории из реальной практики");
    } else if (score < 160) {
      r.push("Развивайте харизматичность через практику");
      r.push("Используйте паузы для создания напряжения");
    } else if (score < 180) {
      r.push("Продолжайте развивать своё сценическое присутствие");
    }
    return r;
  }

  private generateMockTranscription(): string {
    return `Добро пожаловать на урок математики. Сегодня мы изучаем квадратные уравнения. 
    Квадратное уравнение имеет вид ax² + bx + c = 0, где a не равно нулю. 
    Для решения квадратных уравнений мы можем использовать несколько методов. 
    Первый метод — это факторизация. Второй метод — использование формулы дискриминанта. 
    Давайте рассмотрим примеры. Возьмём уравнение x² - 5x + 6 = 0. 
    Мы можем разложить это на множители: (x - 2)(x - 3) = 0. 
    Следовательно, x = 2 или x = 3. Это наши решения. 
    Теперь попробуйте решить следующее уравнение самостоятельно.`;
  }

  private calculatePoseStability(poseData: any[]): number {
    if (poseData.length < 2) return 0.5;
    let totalMovement = 0, validFrames = 0;
    for (let i = 1; i < poseData.length; i++) {
      const curr = poseData[i]?.landmarks?.[0];
      const prev = poseData[i-1]?.landmarks?.[0];
      if (curr && prev &&
          typeof curr.x === 'number' && !isNaN(curr.x) &&
          typeof prev.x === 'number' && !isNaN(prev.x)) {
        const m = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        if (!isNaN(m)) { totalMovement += m; validFrames++; }
      }
    }
    if (validFrames === 0) return 0.5;
    const avg = totalMovement / validFrames;
    return isNaN(avg) ? 0.5 : Math.max(0, 1 - avg * 50);
  }

  private calculateEyeContactRatio(faceData: any[]): number {
    if (faceData.length === 0) return 0;
    let count = 0;
    faceData.forEach(frame => {
      if (frame.blendshapes?.categories) {
        const away = frame.blendshapes.categories
          .filter((bs: any) => bs.categoryName.includes('eyeLook'))
          .reduce((s: number, bs: any) => s + bs.score, 0);
        if (away < 0.3) count++;
      }
    });
    return count / faceData.length;
  }

  /**
   * вычисляем динамику речи из реальных данных.
   */
  private calculateSpeechDynamics(audioData: any): number {
    if (!audioData) return 0.5;

    const wpm: number = audioData.vocabulary?.speakingRate ?? 0;
    let paceComponent = 0.5;
    if (wpm > 0) {
      if      (wpm >= 120 && wpm <= 160) paceComponent = 1.0;
      else if (wpm >= 100 && wpm < 120)  paceComponent = 0.8;
      else if (wpm > 160 && wpm <= 190)  paceComponent = 0.8;
      else if (wpm >= 80  && wpm < 100)  paceComponent = 0.6;
      else if (wpm > 190)                paceComponent = 0.6;
      else                               paceComponent = 0.4;
    }

    const fillerRatio: number = audioData.vocabulary?.fillerWordsRatio ?? 0;
    const fillerComponent = Math.max(0, 1 - fillerRatio * 5);

    const ch = audioData.characteristics;
    let amplitudeComponent = 0.6;
    if (ch) {
      const rms: number | undefined =
        ch.rms ?? ch.averageAmplitude ?? ch.meanAmplitude ?? ch.avgAmplitude;
      if (rms !== undefined && !isNaN(rms)) {
        amplitudeComponent = Math.min(1, rms * 5);
      }
    }

    return paceComponent * 0.4 + fillerComponent * 0.3 + amplitudeComponent * 0.3;
  }

  private calculateMovementDynamics(poseData: any[]): number {
    if (poseData.length < 2) return 0.5;
    let totalMovement = 0, validFrames = 0;
    for (let i = 1; i < poseData.length; i++) {
      const curr = poseData[i]?.landmarks?.[0];
      const prev = poseData[i-1]?.landmarks?.[0];
      if (curr && prev &&
          typeof curr.x === 'number' && !isNaN(curr.x) &&
          typeof prev.x === 'number' && !isNaN(prev.x)) {
        const m = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        if (!isNaN(m)) { totalMovement += m; validFrames++; }
      }
    }
    if (validFrames === 0) return 0.5;
    const avg = totalMovement / validFrames;
    return isNaN(avg) ? 0.5 : Math.min(1, avg * 100);
  }

  private getFallbackAnalysis(): ComprehensiveAnalysis {
    return {
      totalScore: 500, maxTotalScore: 1000, percentage: 50, grade: 'C',
      metrics: {
        posture: {
          score: 100, maxScore: 200,
          spineAlignment: 20, shoulderSymmetry: 20, headPosition: 20, stability: 20, confidence: 20,
          issues: ["Невозможно проанализировать позу"],
          recommendations: ["Убедитесь, что видео корректно загружено"]
        },
        gesticulation: {
          score: 100, maxScore: 200,
          variety: 20, frequency: 20, appropriateness: 20, expressiveness: 20, coordination: 20,
          gestures: [], recommendations: ["Невозможно проанализировать жесты"]
        },
        facial: {
          score: 100, maxScore: 200,
          expressiveness: 20, eyeContact: 20, smileFrequency: 20, emotionalRange: 20, authenticity: 20,
          expressions: [], recommendations: ["Невозможно проанализировать мимику"]
        },
        speech: {
          score: 100, maxScore: 200,
          clarity: 20, pace: 20, volume: 20, vocabulary: 20, grammar: 20,
          fillerWords: 0, transcription: "Анализ речи недоступен",
          recommendations: ["Невозможно проанализировать речь"]
        },
        engagement: {
          score: 100, maxScore: 200,
          attention: 20, interaction: 20, energy: 20, presence: 20, charisma: 20,
          recommendations: ["Невозможно оценить вовлеченность"]
        }
      },
      overallFeedback: "Анализ невозможен из-за проблем с видео. Попробуйте загрузить другое видео.",
      strengths: ["Попытка анализа выполнена"],
      priorityAreas: ["Проверьте формат и качество видео", "Убедитесь что человек виден в кадре"],
      improvementPlan: ["Повторите загрузку видео"],
      aiReport: undefined
    };
  }
}

export const scoringService = new ScoringService();