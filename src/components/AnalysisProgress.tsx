import React, { useEffect, useState } from 'react';
import { Brain, Eye, Users, MessageSquare, BarChart3, Mic, FileText, Languages, Loader2 } from './icons';
import { motion } from 'framer-motion';

interface AnalysisProgressProps {
  file: File;
  onComplete: (results: any) => void;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ file, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [detailedProgress, setDetailedProgress] = useState({
    initialization: 0,
    videoAnalysis: 0,
    audioAnalysis: 0,
    scoring: 0
  });
  const [qualityMetrics, setQualityMetrics] = useState({
    videoQuality: 'Проверка...',
    audioQuality: 'Проверка...',
    analysisQuality: 'Ожидание...'
  });

  const hasYandexCredentials = true;

  const [yandexConfig] = useState({
    enabled: hasYandexCredentials,
    languages: ['ru-RU', 'kk-KZ', 'en-US'],
    autoDetectLanguage: true,
    includeFillerWords: true,
    connectionStatus: 'not_tested' as 'not_tested' | 'testing' | 'success' | 'failed'
  });

  const videoFile = file;
  const fileName = file.name;
  const onAnalysisComplete = onComplete;

  const analysisSteps = [
    { icon: Eye, title: "Подготовка моделей", description: "Инициализация анализа" },
    { icon: Users, title: "Поза и движения", description: "Осанка, стабильность, уверенность" },
    { icon: MessageSquare, title: "Жесты и мимика", description: "Выразительность и контакт" },
    { icon: Mic, title: "Анализ речи", description: "Распознавание и разбор речи" },
    { icon: FileText, title: "Структура урока", description: "Логика и содержание" },
    { icon: Brain, title: "Итоговая оценка", description: "Сбор отчёта по разделам" }
  ];

  useEffect(() => {
    const runComprehensiveAnalysis = async () => {
      try {
        setCurrentStep(0);
        setProgress(5);
        setDetailedProgress(prev => ({ ...prev, initialization: 20 }));

        const { mediaPipeService } = await import('../services/MediaPipeService');
        await mediaPipeService.initialize();

        setDetailedProgress(prev => ({ ...prev, initialization: 100 }));
        setProgress(15);

        setCurrentStep(1);
        setProgress(20);

        const videoAnalysis = await mediaPipeService.analyzeVideo(videoFile, (videoProgress) => {
          const adjustedProgress = 20 + (videoProgress * 0.4);
          setProgress(adjustedProgress);
          setDetailedProgress(prev => ({ ...prev, videoAnalysis: videoProgress }));
        });

        const analysisQuality = mediaPipeService.getAnalysisQuality(videoAnalysis);
        setQualityMetrics(prev => ({
          ...prev,
          videoQuality: `${videoAnalysis.frameCount} кадров`,
          analysisQuality
        }));

        setCurrentStep(2);
        setProgress(60);

        setCurrentStep(3);
        setProgress(65);
        setDetailedProgress(prev => ({ ...prev, audioAnalysis: 20 }));

        const { audioAnalysisService } = await import('../services/AudioAnalysisService');

        if (yandexConfig.enabled) {
          audioAnalysisService.updateConfig({
            useYandexSpeechKit: true,
            languages: yandexConfig.languages,
            autoDetectLanguage: yandexConfig.autoDetectLanguage,
            includeFillerWords: yandexConfig.includeFillerWords
          });
        }

        const audioAnalysis = await audioAnalysisService.analyzeAudio(videoFile, (audioProgress) => {
          setDetailedProgress(prev => ({ ...prev, audioAnalysis: audioProgress }));
        });

        setDetailedProgress(prev => ({ ...prev, audioAnalysis: 100 }));

        let transcriptionInfo = 'Обработка...';
        if (audioAnalysis.transcriptionMetadata) {
          const meta = audioAnalysis.transcriptionMetadata;
          transcriptionInfo = `${Math.round(meta.confidence * 100)}% точность, ${meta.fillerWordsCount} зап.`;
        }

        setQualityMetrics(prev => ({ ...prev, audioQuality: transcriptionInfo }));

        setCurrentStep(4);
        setProgress(80);

        setCurrentStep(5);
        setProgress(85);
        setDetailedProgress(prev => ({ ...prev, scoring: 30 }));

        try {
          const { scoringService } = await import('../services/ScoringService');
          
          console.log('🔍 Preparing data for ScoringService:', {
            poseDataLength: videoAnalysis.poseData.length,
            gestureDataLength: videoAnalysis.gestureData.length,
            faceDataLength: videoAnalysis.faceData.length,
            videoDuration: videoAnalysis.videoDuration,
            hasTranscription: !!audioAnalysis.transcription
          });

          const comprehensiveResults = await scoringService.calculateComprehensiveScore(
            videoAnalysis.poseData,
            videoAnalysis.gestureData,
            videoAnalysis.faceData,
            audioAnalysis,
            videoAnalysis.videoDuration
          );

          console.log('🎯 ScoringService Results:', {
            totalScore: comprehensiveResults.totalScore,
            strengths: comprehensiveResults.strengths,
            priorityAreas: comprehensiveResults.priorityAreas,
            postureScore: comprehensiveResults.metrics.posture.score,
            speechScore: comprehensiveResults.metrics.speech.score
          });

          setDetailedProgress(prev => ({ ...prev, scoring: 100 }));
          setProgress(100);

          const finalResults = {
            ...comprehensiveResults,
            analysisDetails: {
              videoAnalysis,
              audioAnalysis,
              qualityMetrics: { ...qualityMetrics, analysisQuality },
              multilingualAnalysis: {
                yandexSpeechKitUsed: yandexConfig.enabled,
                detectedLanguages: audioAnalysis.transcriptionMetadata?.detectedLanguages || [],
                fillerWordsCount: audioAnalysis.transcriptionMetadata?.fillerWordsCount || 0
              }
            }
          };

          setTimeout(() => {
            onAnalysisComplete(finalResults);
          }, 1500);

        } catch (scoringError) {
          console.error('❌ ScoringService error:', scoringError);
          console.error('Error details:', {
            message: scoringError instanceof Error ? scoringError.message : 'Unknown error',
            stack: scoringError instanceof Error ? scoringError.stack : 'No stack trace'
          });
          
          // Fallback - создаем минимальные результаты
          const fallbackResults = {
            totalScore: 500,
            maxTotalScore: 1000,
            percentage: 50,
            grade: 'C',
            metrics: {
              posture: { score: 100, maxScore: 200 },
              gesticulation: { score: 100, maxScore: 200 },
              facial: { score: 100, maxScore: 200 },
              speech: { score: 100, maxScore: 200 },
              engagement: { score: 100, maxScore: 200 }
            },
            strengths: ['Анализ завершен с ошибками', 'Повторите попытку'],
            priorityAreas: ['Проверьте качество видео', 'Убедитесь что человек виден в кадре'],
            overallFeedback: 'Произошла ошибка при анализе. Попробуйте загрузить видео лучшего качества.',
            aiReport: null
          };

          setDetailedProgress(prev => ({ ...prev, scoring: 100 }));
          setProgress(100);

          setTimeout(() => {
            onAnalysisComplete(fallbackResults);
          }, 1500);
        }

      } catch (error) {
        console.error('Analysis failed:', error);
        setProgress(100);
      }
    };

    runComprehensiveAnalysis();
  }, [file, onComplete, yandexConfig]);

  const CurrentStepIcon = analysisSteps[currentStep]?.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 space-y-8 md:space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-700 tracking-tight text-[var(--text-primary)] mb-3">
          Анализ видео
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)]">
          <span className="font-600 text-[var(--text-primary)]">{fileName}</span> • обработка в процессе...
        </p>
      </motion.div>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="liquid-glass p-4 md:p-6"
      >
        <div className="flex items-center space-x-4">
          <div className="liquid-glass w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 md:w-7 md:h-7 text-[var(--accent)] animate-spin" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-600 text-[var(--text-primary)]">Идёт обработка записи</h3>
            <p className="text-sm text-[var(--text-secondary)]">Обычно занимает 2–3 минуты</p>
          </div>
        </div>
      </motion.div>

      {/* Main Progress */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="liquid-glass p-6 md:p-8"
      >
        <div className="mb-8">
          <div className="flex justify-between items-end mb-4">
            <span className="text-xs font-700 uppercase tracking-wider text-[var(--text-secondary)]">Общий прогресс</span>
            <span className="text-3xl font-700 text-gradient">{Math.round(progress)}%</span>
          </div>
          <div className="liquid-glass h-3 rounded-full overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="liquid-glass p-4 md:p-6">
          <div className="flex items-center space-x-4">
            <div className="liquid-glass liquid-button-primary w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-lg">
              {CurrentStepIcon && <CurrentStepIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />}
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-600 text-[var(--text-primary)] tracking-tight leading-none mb-1">
                {analysisSteps[currentStep]?.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {analysisSteps[currentStep]?.description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Progress */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { key: 'initialization', label: 'Инициализация', icon: Brain },
          { key: 'videoAnalysis', label: 'Видео', icon: Eye },
          { key: 'audioAnalysis', label: 'Аудио', icon: Languages },
          { key: 'scoring', label: 'Оценка', icon: BarChart3 }
        ].map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="liquid-glass p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <item.icon className="w-5 h-5 text-[var(--text-tertiary)]" />
              <span className="text-sm font-700 text-[var(--text-primary)]">
                {Math.round(detailedProgress[item.key as keyof typeof detailedProgress])}%
              </span>
            </div>
            <div className="text-xs font-600 uppercase tracking-wider text-[var(--text-secondary)] mb-2">{item.label}</div>
            <div className="liquid-glass h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${detailedProgress[item.key as keyof typeof detailedProgress]}%` }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quality Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="liquid-glass p-6 md:p-8"
      >
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="text-xs font-700 uppercase tracking-wider text-[var(--text-secondary)]">Качество обработки</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: 'Видео', value: qualityMetrics.videoQuality, icon: Eye },
            { label: 'Аудио', value: qualityMetrics.audioQuality, icon: Languages },
            { label: 'Качество', value: qualityMetrics.analysisQuality, icon: Brain }
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="liquid-glass p-4"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="liquid-glass w-10 h-10 rounded-lg flex items-center justify-center">
                  <metric.icon className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="text-xs font-600 text-[var(--text-secondary)]">{metric.label}</div>
              </div>
              <div className="text-sm md:text-base font-600 text-[var(--text-primary)]">{metric.value}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Technical Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[var(--text-tertiary)] liquid-glass p-5"
      >
        <div>
          <span className="text-[var(--text-secondary)] block mb-1 font-600 uppercase tracking-wider">Видео</span>
          Поза, жесты и мимика по точкам MediaPipe
        </div>
        <div>
          <span className="text-[var(--text-secondary)] block mb-1 font-600 uppercase tracking-wider">Речь</span>
          Транскрипция и анализ темпа, чистоты, словаря
        </div>
        <div>
          <span className="text-[var(--text-secondary)] block mb-1 font-600 uppercase tracking-wider">Отчёт</span>
          Итоговая оценка и рекомендации по разделам
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisProgress;
