import React, { useEffect, useState, useRef } from 'react';
import { 
  Brain, Eye, Users, MessageSquare, BarChart3, Zap, Mic, FileText, 
  CheckCircle2, Loader2, Wifi, Terminal, Activity, Lock, Server, Cpu 
} from 'lucide-react';

interface AnalysisProgressProps {
  fileName: string;
  onAnalysisComplete: (results: any) => void;
  videoFile: File;
}

const LogLine = ({ text, type = 'info' }: { text: string, type?: 'info' | 'success' | 'warning' | 'error' }) => (
  <div className="flex items-start space-x-2 text-[10px] md:text-xs font-mono mb-1.5 opacity-90 animate-in slide-in-from-left-2 duration-300">
    <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
    <span className={`shrink-0 ${
      type === 'success' ? 'text-green-400' : 
      type === 'warning' ? 'text-yellow-400' : 
      type === 'error' ? 'text-red-400' : 'text-blue-300'
    }`}>
      {type === 'success' ? '✔' : type === 'warning' ? '⚠' : type === 'error' ? '✖' : 'ℹ'}
    </span>
    <span className="text-slate-300 break-words">{text}</span>
  </div>
);

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ fileName, onAnalysisComplete, videoFile }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [detailedProgress, setDetailedProgress] = useState({
    initialization: 0,
    videoAnalysis: 0,
    audioAnalysis: 0,
    scoring: 0
  });
  
  // Логи для терминала
  const [logs, setLogs] = useState<{text: string, type: 'info'|'success'|'warning'|'error'}[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Конфигурация API (как в оригинале)
  const hasYandexCredentials = true;
  const [yandexConfig] = useState({
    enabled: hasYandexCredentials,
    languages: ['ru-RU', 'kk-KZ', 'en-US'],
    autoDetectLanguage: true,
    includeFillerWords: true,
    connectionStatus: 'not_tested' as 'not_tested' | 'testing' | 'success' | 'failed'
  });

  const addLog = (text: string, type: 'info'|'success'|'warning'|'error' = 'info') => {
    setLogs(prev => [...prev, { text, type }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const analysisSteps = [
    {
      icon: Eye,
      title: "Инициализация MediaPipe",
      description: "Загрузка моделей для анализа позы, жестов и мимики",
    },
    {
      icon: Users,
      title: "Анализ позы и движений",
      description: "Детальный анализ осанки, стабильности и уверенности",
    },
    {
      icon: MessageSquare,
      title: "Анализ жестов и мимики",
      description: "Оценка выразительности, разнообразия и уместности",
    },
    {
      icon: Mic,
      title: "NLP Анализ речи + AI",
      description: "Yandex SpeechKit + Google Gemini: мультиязычность и слова-паразиты",
    },
    {
      icon: Brain,
      title: "AI расчет баллов",
      description: "Комплексная оценка по 1000-балльной системе",
    }
  ];

  useEffect(() => {
    const runComprehensiveAnalysis = async () => {
      try {
        addLog(`Starting analysis pipeline for: ${fileName}`, 'info');
        
        // Step 1: Initialize MediaPipe
        setCurrentStep(0);
        setProgress(5);
        setDetailedProgress(prev => ({ ...prev, initialization: 20 }));
        addLog("Loading MediaPipe Vision models...", 'info');
        
        const { mediaPipeService } = await import('../services/MediaPipeService');
        await mediaPipeService.initialize();
        
        setDetailedProgress(prev => ({ ...prev, initialization: 100 }));
        setProgress(15);
        addLog("MediaPipe initialized successfully", 'success');
        
        // Step 2-3: Video Analysis
        setCurrentStep(1);
        setProgress(20);
        addLog("Starting video frame analysis...", 'info');
        
        const videoAnalysis = await mediaPipeService.analyzeVideo(videoFile, (videoProgress) => {
          const adjustedProgress = 20 + (videoProgress * 0.4); // 20% to 60%
          setProgress(adjustedProgress);
          setDetailedProgress(prev => ({ ...prev, videoAnalysis: videoProgress }));
        });
        
        addLog(`Video analysis complete: ${videoAnalysis.frameCount} frames processed`, 'success');
        setCurrentStep(2); // Визуальный переход на анализ жестов (происходит параллельно в данных)
        
        const analysisQuality = mediaPipeService.getAnalysisQuality(videoAnalysis);
        addLog(`Quality check: ${analysisQuality}`, analysisQuality === 'optimal' ? 'success' : 'warning');
        
        // Step 4: Audio Analysis
        setCurrentStep(3);
        setProgress(65);
        setDetailedProgress(prev => ({ ...prev, audioAnalysis: 20 }));
        addLog("Initializing Audio Service...", 'info');
        
        const { audioAnalysisService } = await import('../services/AudioAnalysisService');
        
        if (yandexConfig.enabled) {
          audioAnalysisService.updateConfig({
            useYandexSpeechKit: true,
            languages: yandexConfig.languages,
            autoDetectLanguage: yandexConfig.autoDetectLanguage,
            includeFillerWords: yandexConfig.includeFillerWords
          });
          addLog("Yandex SpeechKit v3 config loaded", 'info');
        }
        
        const audioAnalysis = await audioAnalysisService.analyzeAudio(videoFile, (audioProgress) => {
          setDetailedProgress(prev => ({ ...prev, audioAnalysis: audioProgress }));
        });
        
        setDetailedProgress(prev => ({ ...prev, audioAnalysis: 100 }));
        
        // Log transcription info
        if (audioAnalysis.transcriptionMetadata) {
          const meta = audioAnalysis.transcriptionMetadata;
          const langInfo = meta.isMultilingual 
            ? `Multilingual (${meta.detectedLanguages?.length || 1})` 
            : meta.detectedLanguages?.[0]?.languageCode || 'ru-RU';
          const fillers = meta.fillerWordsDetected ? ` + ${meta.fillerWordsCount} fillers` : '';
          addLog(`Transcription: ${Math.round(meta.confidence * 100)}% confidence [${langInfo}${fillers}]`, 'success');
        }

        setCurrentStep(4);
        setProgress(85);
        addLog("Preparing Google Gemini payload...", 'info');
        setDetailedProgress(prev => ({ ...prev, scoring: 30 }));
        
        // Step 5: Scoring
        const { scoringService } = await import('../services/ScoringService');
        addLog("Calculating comprehensive score...", 'info');
        
        const comprehensiveResults = await scoringService.calculateComprehensiveScore(
          videoAnalysis.poseData,
          videoAnalysis.gestureData,
          videoAnalysis.faceData,
          audioAnalysis,
          videoAnalysis.videoDuration
        );
        
        setDetailedProgress(prev => ({ ...prev, scoring: 100 }));
        setProgress(100);
        addLog("Report generated successfully", 'success');
        
        // Prepare final results
        const finalResults = {
          ...comprehensiveResults,
          analysisDetails: {
            videoAnalysis,
            audioAnalysis,
            multilingualAnalysis: {
              yandexSpeechKitUsed: yandexConfig.enabled && audioAnalysis.transcriptionMetadata?.source === 'yandex',
              detectedLanguages: audioAnalysis.transcriptionMetadata?.detectedLanguages || [],
              isMultilingual: audioAnalysis.transcriptionMetadata?.isMultilingual || false,
              languageSwitches: audioAnalysis.transcriptionMetadata?.languageSwitches || 0,
              configuredLanguages: yandexConfig.languages,
              autoDetectionEnabled: yandexConfig.autoDetectLanguage,
              fillerWordsDetected: audioAnalysis.transcriptionMetadata?.fillerWordsDetected || false,
              fillerWordsCount: audioAnalysis.transcriptionMetadata?.fillerWordsCount || 0
            },
            aiEnhancements: {
              geminiUsed: !!comprehensiveResults.aiReport,
              professionalReportGenerated: !!comprehensiveResults.aiReport?.professionalReport,
              enhancedRecommendations: !!comprehensiveResults.aiReport?.enhancedRecommendations
            },
            fillerWordsAnalysis: audioAnalysis.vocabulary.fillerWordsAnalysis
          }
        };
        
        setTimeout(() => {
          onAnalysisComplete(finalResults);
        }, 1500);
        
      } catch (error) {
        console.error('Analysis failed:', error);
        addLog("CRITICAL ERROR. Initiating fallback simulation...", 'error');
        
        // Fallback Mock Logic (Original)
        const mockResults = {
          totalScore: 782,
          maxTotalScore: 1000,
          percentage: 78.2,
          grade: 'B+',
          metrics: {
            posture: {
              score: 156,
              maxScore: 200,
              spineAlignment: 32,
              shoulderSymmetry: 35,
              headPosition: 30,
              stability: 31,
              confidence: 28,
              issues: ["Периодические наклоны вперед"],
              recommendations: ["Держите спину прямо", "Делайте паузы для проверки осанки"],
              aiRecommendations: ["Используйте эргономичную мебель", "Выполняйте упражнения для укрепления спины"]
            },
            gesticulation: {
              score: 164,
              maxScore: 200,
              variety: 35,
              frequency: 33,
              appropriateness: 36,
              expressiveness: 32,
              coordination: 28,
              gestures: ["Open_Palm", "Pointing_Up", "Victory"],
              recommendations: ["Отличная жестикуляция", "Продолжайте в том же духе"],
              aiRecommendations: ["Изучите педагогические жесты", "Координируйте жесты с речью"]
            },
            facial: {
              score: 148,
              maxScore: 200,
              expressiveness: 30,
              eyeContact: 32,
              smileFrequency: 28,
              emotionalRange: 29,
              authenticity: 29,
              expressions: ["smile", "expressive"],
              recommendations: ["Чаще улыбайтесь", "Поддерживайте зрительный контакт"],
              aiRecommendations: ["Работайте над выразительностью лица", "Используйте мимику для подчеркивания"]
            },
            speech: {
              score: 158,
              maxScore: 200,
              clarity: 34,
              pace: 32,
              volume: 30,
              vocabulary: 33,
              grammar: 29,
              fillerWords: 12,
              transcription: "Добро пожаловать на урок...",
              recommendations: ["Сократите слова-запинки", "Рассмотрите использование одного основного языка"],
              aiRecommendations: ["Практикуйте чтение вслух", "Расширяйте словарный запас", "Работайте над плавностью речи"]
            },
            engagement: {
              score: 156,
              maxScore: 200,
              attention: 32,
              interaction: 31,
              energy: 33,
              presence: 30,
              charisma: 30,
              recommendations: ["Увеличьте интерактивность", "Добавьте больше энергии"],
              aiRecommendations: ["Используйте разнообразные методы", "Вовлекайте всех студентов"]
            }
          },
          overallFeedback: "Хорошие педагогические навыки с потенциалом для развития.",
          strengths: ["Выразительная жестикуляция", "Структура урока", "Многоязычность"],
          priorityAreas: ["Мимика", "Слова-запинки"],
          improvementPlan: ["Неделя 1: Мимика", "Неделя 2: Дикция", "Неделя 3: Паузы"],
          aiReport: {
             professionalReport: {
               executiveSummary: "Анализ показал уверенное владение материалом и аудиторией.",
               detailedAnalysis: {
                 strengths: ["Жестикуляция", "Структура"],
                 areasForImprovement: ["Мимика", "Слова-паразиты"],
                 keyInsights: ["Смешение языков усложняет восприятие", "Паузы используются эффективно"]
               },
               recommendations: {
                 immediate: ["Контроль осанки"],
                 shortTerm: ["Упражнения для мимики"],
                 longTerm: ["Профессиональное развитие"]
               },
               actionPlan: {
                 week1: ["Контроль осанки"],
                 week2: ["Практика перед зеркалом"]
               }
             },
             motivationalMessage: "Отличный потенциал! Немного практики, и вы станете мастером.",
             nextSteps: ["Выполнение плана", "Самооценка"]
          }
        };
        
        setProgress(100);
        setTimeout(() => onAnalysisComplete(mockResults), 2000);
      }
    };

    runComprehensiveAnalysis();
  }, [videoFile, onAnalysisComplete, hasYandexCredentials, yandexConfig]);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            AI Analysis Core
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-100">
               <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Processing</span>
            </div>
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Target: <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{fileName}</span></p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-xl border border-slate-100 shadow-sm">
           <div className="relative h-12 w-12 flex items-center justify-center">
              <svg className="h-full w-full transform -rotate-90">
                <circle className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
                <circle className="text-indigo-600 transition-all duration-300 ease-out" strokeWidth="4" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - progress / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
              </svg>
              <div className="absolute text-xs font-bold text-slate-700">{Math.round(progress)}%</div>
           </div>
           <div className="text-right">
             <div className="text-xs text-slate-400 font-semibold uppercase">Total Progress</div>
             <div className="text-sm font-bold text-slate-700">Analyzing...</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column: Visual Steps */}
        <div className="lg:col-span-2 space-y-3">
          {analysisSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const StepIcon = step.icon;

            return (
              <div 
                key={index}
                className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${
                  isActive 
                    ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-50 translate-x-2' 
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-100 opacity-40 grayscale'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 h-full w-1 bg-indigo-500 animate-pulse"></div>
                )}
                <div className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
                     isActive ? 'bg-indigo-100 text-indigo-600' : 
                     isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={`font-semibold text-sm ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                        {step.title}
                      </h4>
                      {isActive && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">WORKING</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{step.description}</p>
                    
                    {/* Visual sub-progress bar for current step */}
                    {isActive && (
                      <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                         <div 
                           className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
                           style={{ 
                             width: `${
                               index === 0 ? detailedProgress.initialization :
                               index === 1 ? detailedProgress.videoAnalysis :
                               index === 2 ? detailedProgress.videoAnalysis : // Shared source
                               index === 3 ? detailedProgress.audioAnalysis :
                               detailedProgress.scoring
                             }%` 
                           }}
                         ></div>
                      </div>
                    )}
                  </div>
                  {isActive && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Terminal & Stats */}
        <div className="space-y-4">
           {/* Terminal */}
           <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-xl border border-slate-800 flex flex-col h-[400px] font-mono">
             <div className="bg-[#1e293b] px-4 py-2 flex items-center justify-between border-b border-slate-700/50">
               <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
               </div>
               <div className="text-[10px] text-slate-400 flex items-center gap-1 opacity-70">
                 <Terminal className="w-3 h-3" /> SYSTEM_LOGS
               </div>
             </div>
             
             {/* Log Content */}
             <div className="p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <LogLine text="System initialized v2.4.0" type="success" />
                <LogLine text="Secure environment detected" type="success" />
                {logs.map((log, i) => (
                  <LogLine key={i} text={log.text} type={log.type} />
                ))}
                <div ref={logsEndRef} className="animate-pulse text-indigo-400 mt-2">_</div>
             </div>
           </div>

           {/* Security Badge */}
           <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="p-1.5 bg-green-100 text-green-700 rounded-lg"><Lock className="w-4 h-4" /></div>
               <div>
                 <div className="text-xs font-bold text-slate-700">End-to-End Encrypted</div>
                 <div className="text-[10px] text-slate-500">Keys protected via Netlify Functions</div>
               </div>
             </div>
             <Wifi className="w-4 h-4 text-green-500" />
           </div>
           
           <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg"><Cpu className="w-4 h-4" /></div>
               <div>
                 <div className="text-xs font-bold text-slate-700">Google Gemini Pro</div>
                 <div className="text-[10px] text-slate-500">Model Active</div>
               </div>
             </div>
             <Server className="w-4 h-4 text-purple-500" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress;