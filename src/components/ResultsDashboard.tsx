import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Star, Download, Share2, RotateCcw, Target, Users, 
  Brain, MessageSquare, BookOpen, Lightbulb, Award, Sparkles, Zap, CheckCircle2,
  ChevronRight, AlertTriangle
} from 'lucide-react';
import { ComprehensiveAnalysis } from '../services/ScoringService';

interface ResultsDashboardProps {
  results: ComprehensiveAnalysis;
  onReset: () => void;
}

// Переиспользуемый компонент карточки Bento
const BentoCard = ({ children, className = "", title, icon: Icon, subTitle, headerAction }: any) => (
  <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-slate-200 ${className}`}>
    {(title || Icon) && (
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">{title}</h3>
            {subTitle && <p className="text-xs text-slate-500 font-medium">{subTitle}</p>}
          </div>
        </div>
        {headerAction}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const ProgressBar = ({ value, color = "bg-indigo-500", label, max = 40 }: any) => {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-4 last:mb-0 group">
      <div className="flex justify-between text-xs font-semibold mb-1.5">
        <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
        <span className="text-slate-900">{value}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, onReset }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Результаты анализа</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Отчет сгенерирован AI • {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onReset} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Новый разбор
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all hover:scale-105 font-semibold text-sm shadow-lg shadow-indigo-200">
            <Download className="w-4 h-4" /> Скачать PDF
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-5 mb-8">
        
        {/* 1. HERO SCORE CARD (Dark Themed) */}
        <BentoCard className="md:col-span-2 lg:col-span-2 bg-[#0f172a] text-white border-slate-800 relative group overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 p-32 bg-indigo-600/30 rounded-full blur-[80px] group-hover:bg-indigo-600/40 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 p-20 bg-purple-600/20 rounded-full blur-[60px]"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center py-4">
            <div className="mb-6 relative">
               <div className="w-40 h-40 rounded-full border-[6px] border-slate-700/50 flex items-center justify-center relative">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <circle 
                      cx="80" cy="80" r="70" 
                      fill="none" stroke="#6366f1" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={2 * Math.PI * 70 * (1 - results.percentage / 100)}
                      className="transition-all duration-1000 ease-out"
                    />
                 </svg>
                 <div className="flex flex-col">
                   <span className="text-5xl font-black tracking-tighter">{results.totalScore}</span>
                   <span className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">из {results.maxTotalScore}</span>
                 </div>
               </div>
               <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white text-slate-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                 Grade {results.grade}
               </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-200">
                {results.percentage >= 80 ? "Отличная работа! 🎉" : results.percentage >= 60 ? "Хороший результат 👍" : "Есть над чем работать 💪"}
              </p>
              <p className="text-sm text-slate-400">
                 {results.percentage >= 80 ? "Ваши показатели выше среднего." : "Мы подготовили план улучшений."}
              </p>
            </div>
          </div>
        </BentoCard>

        {/* 2. AI SUMMARY (Wide) */}
        <BentoCard 
          className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-white via-white to-indigo-50/50" 
          title="Резюме Искусственного Интеллекта" 
          icon={Brain}
          headerAction={
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide">
              Gemini Pro
            </span>
          }
        >
          <div className="flex flex-col justify-between h-full">
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-lg text-slate-700 leading-relaxed font-medium">
                "{results.aiReport?.professionalReport?.executiveSummary || results.overallFeedback}"
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
              <div className="bg-green-50/80 rounded-2xl p-4 border border-green-100">
                <h4 className="flex items-center gap-2 text-sm font-bold text-green-800 mb-2">
                  <TrendingUp className="w-4 h-4" /> Сильные стороны
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(results.aiReport?.professionalReport?.detailedAnalysis?.strengths || results.strengths).slice(0, 3).map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-green-700 rounded-lg text-xs font-semibold shadow-sm border border-green-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-100">
                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-2">
                  <Target className="w-4 h-4" /> Зоны роста
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(results.aiReport?.professionalReport?.detailedAnalysis?.areasForImprovement || results.priorityAreas).slice(0, 2).map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-amber-700 rounded-lg text-xs font-semibold shadow-sm border border-amber-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* 3. METRIC CARDS (Square-ish) */}
        
        {/* Posture */}
        <BentoCard title="Поза и Осанка" icon={Users} className="md:col-span-2">
           <div className="flex items-end gap-2 mb-6">
             <span className="text-3xl font-bold text-slate-900">{results.metrics.posture.score}</span>
             <span className="text-sm text-slate-400 font-medium mb-1.5">/ {results.metrics.posture.maxScore} баллов</span>
           </div>
           <div className="space-y-4">
             <ProgressBar label="Стабильность корпуса" value={results.metrics.posture.stability} color="bg-blue-500" />
             <ProgressBar label="Уверенность позы" value={results.metrics.posture.confidence} color="bg-blue-500" />
             <ProgressBar label="Положение головы" value={results.metrics.posture.headPosition} color="bg-blue-400" />
           </div>
           <div className="mt-5 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 font-medium leading-relaxed flex gap-2">
             <Lightbulb className="w-4 h-4 shrink-0" />
             {results.metrics.posture.recommendations[0]}
           </div>
        </BentoCard>

        {/* Speech */}
        <BentoCard title="Речь и Аудио" icon={BookOpen} className="md:col-span-2">
           <div className="flex items-end gap-2 mb-6">
             <span className="text-3xl font-bold text-slate-900">{results.metrics.speech.score}</span>
             <span className="text-sm text-slate-400 font-medium mb-1.5">/ {results.metrics.speech.maxScore} баллов</span>
           </div>
           <div className="space-y-4">
             <ProgressBar label="Четкость дикции" value={results.metrics.speech.clarity} color="bg-indigo-500" />
             <ProgressBar label="Темп речи" value={results.metrics.speech.pace} color="bg-indigo-500" />
             <ProgressBar label="Словарный запас" value={results.metrics.speech.vocabulary} color="bg-indigo-400" />
           </div>
           <div className="mt-5 flex gap-2">
             <div className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1.5">
               <AlertTriangle className="w-3 h-3" />
               {results.metrics.speech.fillerWords} запинок
             </div>
             {results.analysisDetails?.multilingualAnalysis?.isMultilingual && (
                <div className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                  Multilingual
                </div>
             )}
           </div>
        </BentoCard>

        {/* Engagement */}
        <BentoCard title="Вовлеченность" icon={Zap} className="md:col-span-2">
           <div className="flex items-end gap-2 mb-6">
             <span className="text-3xl font-bold text-slate-900">{results.metrics.engagement.score}</span>
             <span className="text-sm text-slate-400 font-medium mb-1.5">/ {results.metrics.engagement.maxScore} баллов</span>
           </div>
           <div className="space-y-4">
             <ProgressBar label="Энергетика" value={results.metrics.engagement.energy} color="bg-amber-500" />
             <ProgressBar label="Харизма" value={results.metrics.engagement.charisma} color="bg-amber-500" />
             <ProgressBar label="Удержание внимания" value={results.metrics.engagement.attention} color="bg-amber-400" />
           </div>
           <div className="mt-5 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 font-medium leading-relaxed flex gap-2">
             <Lightbulb className="w-4 h-4 shrink-0" />
             {results.metrics.engagement.recommendations[0]}
           </div>
        </BentoCard>
      </div>

      {/* Action Plan & Insight */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Weekly Plan */}
        <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                <Target className="w-5 h-5" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">План развития</h3>
           </div>
           
           <div className="space-y-6 relative">
             <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
             
             {(results.aiReport?.professionalReport?.actionPlan 
                ? Object.entries(results.aiReport.professionalReport.actionPlan) 
                : results.improvementPlan.map((task, i) => [`week${i+1}`, [task]])
             ).map(([week, tasks], index) => (
               <div key={index} className="relative flex gap-6 group">
                 <div className={`w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10 transition-colors duration-300 ${
                   index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                 }`}>
                   <span className="text-sm font-bold">{index + 1}</span>
                 </div>
                 <div className="pt-2 flex-1">
                   <h4 className="font-bold text-slate-900 text-base mb-1">
                     {typeof week === 'string' ? week.replace('week', 'Неделя ') : `Неделя ${index + 1}`}
                   </h4>
                   <div className="text-slate-600 text-sm leading-relaxed">
                     {Array.isArray(tasks) ? tasks.map((t: string, i: number) => (
                       <div key={i} className="mb-1">• {t}</div>
                     )) : tasks}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* AI Insight Gradient Card */}
        {results.aiReport && (
          <div className="bg-gradient-to-b from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 -left-10 w-32 h-32 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 text-yellow-300">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Мотивация от AI</h3>
                <div className="h-1 w-12 bg-yellow-400 rounded-full"></div>
              </div>
              
              <p className="text-indigo-50 text-lg leading-relaxed font-medium mb-8">
                "{results.aiReport.motivationalMessage || "Вы на правильном пути! Продолжайте практиковаться."}"
              </p>
              
              <button className="mt-auto w-full py-3.5 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg">
                <MessageSquare className="w-4 h-4" />
                Обсудить с AI-коучем
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDashboard;