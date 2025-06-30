import React, { useState } from 'react';
import { BarChart3, TrendingUp, Star, Download, Share2, RotateCcw, Target, Users, Brain, MessageSquare, BookOpen, Lightbulb, Award, ChevronRight, Info, Sparkles, Zap } from 'lucide-react';
import { ComprehensiveAnalysis } from '../services/ScoringService';

interface ResultsDashboardProps {
  results: ComprehensiveAnalysis;
  onReset: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, onReset }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'recommendations' | 'ai-report' | 'analytics'>('overview');

  const getScoreColor = (score: number, maxScore: number = 200) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'from-green-500 to-emerald-500';
    if (percentage >= 80) return 'from-blue-500 to-cyan-500';
    if (percentage >= 70) return 'from-yellow-500 to-orange-500';
    if (percentage >= 60) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const categories = [
    { 
      key: 'posture', 
      title: 'Поза и осанка', 
      icon: Target, 
      data: results.metrics.posture,
      description: 'Анализ осанки, стабильности и уверенности'
    },
    { 
      key: 'gesticulation', 
      title: 'Жестикуляция', 
      icon: Users, 
      data: results.metrics.gesticulation,
      description: 'Оценка выразительности и разнообразия жестов'
    },
    { 
      key: 'facial', 
      title: 'Мимика', 
      icon: Brain, 
      data: results.metrics.facial,
      description: 'Анализ выражения лица и зрительного контакта'
    },
    { 
      key: 'speech', 
      title: 'Речь', 
      icon: BookOpen, 
      data: results.metrics.speech,
      description: 'Оценка дикции, темпа и словарного запаса'
    },
    { 
      key: 'engagement', 
      title: 'Вовлеченность', 
      icon: MessageSquare, 
      data: results.metrics.engagement,
      description: 'Анализ харизмы и способности удерживать внимание'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            AI-Enhanced результаты анализа
          </h1>
          {results.aiReport && (
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <p className="text-xl text-gray-600">
          Комплексная оценка педагогического мастерства по 1000-балльной системе
          {results.aiReport && (
            <span className="block text-purple-600 font-medium mt-1">
              ✨ Усилено Google Gemini AI
            </span>
          )}
        </p>
      </div>

      {/* Overall Score Card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl mb-8">
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {/* Score Circle */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-r ${getScoreColor(results.totalScore, 1000)} mb-6 relative`}>
              <div className="text-center">
                <span className="text-4xl font-bold text-white">{results.totalScore}</span>
                <div className="text-white/80 text-sm">из {results.maxTotalScore}</div>
              </div>
              <div className="absolute -top-2 -right-2">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(results.grade)}`}>
                  {results.grade}
                </div>
              </div>
              {results.aiReport && (
                <div className="absolute -bottom-2 -right-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {results.percentage.toFixed(1)}%
            </div>
            <div className="text-lg text-gray-600">
              Общий результат
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {results.aiReport?.professionalReport?.executiveSummary || results.overallFeedback}
            </h2>
            
            {/* Strengths */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Ваши сильные стороны
              </h3>
              <div className="space-y-2">
                {(results.aiReport?.professionalReport?.detailedAnalysis?.strengths || results.strengths).map((strength, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Areas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Target className="w-5 h-5 text-red-500 mr-2" />
                Приоритетные области для развития
              </h3>
              <div className="space-y-2">
                {(results.aiReport?.professionalReport?.detailedAnalysis?.areasForImprovement || results.priorityAreas).map((area, index) => (
                  <div key={index} className="flex items-center text-gray-700">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg">
            <Download className="w-5 h-5" />
            <span>Скачать AI-отчет</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200">
            <Share2 className="w-5 h-5" />
            <span>Поделиться</span>
          </button>
          <button 
            onClick={onReset}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-200"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Новый анализ</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
          {[
            { key: 'overview', label: 'Обзор', icon: BarChart3 },
            { key: 'detailed', label: 'Детальный анализ', icon: TrendingUp },
            { key: 'recommendations', label: 'Рекомендации', icon: Lightbulb },
            ...(results.aiReport ? [{ key: 'ai-report', label: 'AI Отчет', icon: Sparkles }] : []),
            { key: 'analytics', label: 'Аналитика', icon: Info }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getScoreColor(category.data.score)} flex items-center justify-center`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{category.data.score}</div>
                  <div className="text-sm text-gray-500">из {category.data.maxScore}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Прогресс</span>
                  <span>{Math.round((category.data.score / category.data.maxScore) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                 
                    className={`h-3 rounded-full bg-gradient-to-r transition-all duration-1000 ${getScoreColor(category.data.score)}`}
                    style={{ width: `${(category.data.score / category.data.maxScore) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                {(category.data as any).aiRecommendations?.[0] || category.data.recommendations[0]}
              </p>
              
              <button className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                <span>Подробнее</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'detailed' && (
        <div className="space-y-8">
          {categories.map((category, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${getScoreColor(category.data.score)} flex items-center justify-center`}>
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">{category.data.score}</div>
                  <div className="text-sm text-gray-500">из {category.data.maxScore} баллов</div>
                </div>
              </div>
              
              {/* Detailed Metrics */}
              {category.key === 'posture' && (
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Выравнивание позвоночника', value: results.metrics.posture.spineAlignment, max: 40 },
                    { label: 'Симметрия плеч', value: results.metrics.posture.shoulderSymmetry, max: 40 },
                    { label: 'Положение головы', value: results.metrics.posture.headPosition, max: 40 },
                    { label: 'Стабильность', value: results.metrics.posture.stability, max: 40 },
                    { label: 'Уверенность', value: results.metrics.posture.confidence, max: 40 }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(metric.value, metric.max)}`}
                          style={{ width: `${(metric.value / metric.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {category.key === 'gesticulation' && (
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Разнообразие', value: results.metrics.gesticulation.variety, max: 40 },
                    { label: 'Частота', value: results.metrics.gesticulation.frequency, max: 40 },
                    { label: 'Уместность', value: results.metrics.gesticulation.appropriateness, max: 40 },
                    { label: 'Выразительность', value: results.metrics.gesticulation.expressiveness, max: 40 },
                    { label: 'Координация', value: results.metrics.gesticulation.coordination, max: 40 }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(metric.value, metric.max)}`}
                          style={{ width: `${(metric.value / metric.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {category.key === 'facial' && (
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Выразительность', value: results.metrics.facial.expressiveness, max: 40 },
                    { label: 'Зрительный контакт', value: results.metrics.facial.eyeContact, max: 40 },
                    { label: 'Частота улыбок', value: results.metrics.facial.smileFrequency, max: 40 },
                    { label: 'Эмоциональный диапазон', value: results.metrics.facial.emotionalRange, max: 40 },
                    { label: 'Естественность', value: results.metrics.facial.authenticity, max: 40 }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(metric.value, metric.max)}`}
                          style={{ width: `${(metric.value / metric.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {category.key === 'speech' && (
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Четкость', value: results.metrics.speech.clarity, max: 40 },
                    { label: 'Темп', value: results.metrics.speech.pace, max: 40 },
                    { label: 'Громкость', value: results.metrics.speech.volume, max: 40 },
                    { label: 'Словарный запас', value: results.metrics.speech.vocabulary, max: 40 },
                    { label: 'Грамматика', value: results.metrics.speech.grammar, max: 40 }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(metric.value, metric.max)}`}
                          style={{ width: `${(metric.value / metric.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {category.key === 'engagement' && (
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Внимание', value: results.metrics.engagement.attention, max: 40 },
                    { label: 'Взаимодействие', value: results.metrics.engagement.interaction, max: 40 },
                    { label: 'Энергия', value: results.metrics.engagement.energy, max: 40 },
                    { label: 'Присутствие', value: results.metrics.engagement.presence, max: 40 },
                    { label: 'Харизма', value: results.metrics.engagement.charisma, max: 40 }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(metric.value, metric.max)}`}
                          style={{ width: `${(metric.value / metric.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Enhanced Recommendations */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Базовые рекомендации</h4>
                  <ul className="space-y-1">
                    {category.data.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {(category.data as any).aiRecommendations && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI-рекомендации
                    </h4>
                    <ul className="space-y-1">
                      {(category.data as any).aiRecommendations.map((rec: string, recIndex: number) => (
                        <li key={recIndex} className="flex items-start space-x-2 text-sm text-purple-700">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-8">
          {/* Improvement Plan */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
              <Target className="w-6 h-6 text-green-500" />
              <span>План развития на 6 недель</span>
              {results.aiReport && (
                <Sparkles className="w-5 h-5 text-purple-500" />
              )}
            </h3>
            
            <div className="space-y-4">
              {(results.aiReport?.professionalReport?.actionPlan ? 
                Object.entries(results.aiReport.professionalReport.actionPlan).map(([week, tasks]) => ({
                  week: week.replace('week', 'Неделя '),
                  tasks: Array.isArray(tasks) ? tasks : [tasks]
                })) :
                results.improvementPlan.map((step, index) => ({
                  week: `Неделя ${index + 1}`,
                  tasks: [step]
                }))
              ).map((weekPlan, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 mb-2">{weekPlan.week}</h4>
                    {weekPlan.tasks.map((task, taskIndex) => (
                      <p key={taskIndex} className="text-gray-700 mb-1">{task}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Motivational Message */}
          {results.aiReport?.motivationalMessage && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 shadow-lg">
              <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center space-x-3">
                <Zap className="w-6 h-6 text-purple-600" />
                <span>Мотивационное сообщение от AI</span>
              </h3>
              <p className="text-lg text-purple-800 leading-relaxed">
                {results.aiReport.motivationalMessage}
              </p>
            </div>
          )}

          {/* Category-specific recommendations */}
          {categories.map((category, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <category.icon className="w-6 h-6 text-indigo-500" />
                <span>Рекомендации: {category.title}</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <span>Базовые советы</span>
                  </h4>
                  <ul className="space-y-3">
                    {category.data.recommendations.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    {(category.data as any).aiRecommendations ? (
                      <>
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span>AI-рекомендации</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 text-blue-500" />
                        <span>Практические упражнения</span>
                      </>
                    )}
                  </h4>
                  <ul className="space-y-3">
                    {((category.data as any).aiRecommendations || [
                      "Ежедневная практика перед зеркалом (5-10 минут)",
                      "Запись коротких видео для самоанализа",
                      "Работа с коллегами для получения обратной связи"
                    ]).map((tip: string, tipIndex: number) => (
                      <li key={tipIndex} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 ${(category.data as any).aiRecommendations ? 'bg-purple-500' : 'bg-blue-500'} rounded-full mt-2 flex-shrink-0`}></div>
                        <span className="text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ai-report' && results.aiReport && (
        <div className="space-y-8">
          {/* Professional Report */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 shadow-lg">
            <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span>Профессиональный AI-отчет</span>
            </h3>
            
            <div className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h4 className="text-lg font-semibold text-purple-800 mb-3">Резюме</h4>
                <p className="text-purple-700 leading-relaxed">
                  {results.aiReport.professionalReport.executiveSummary}
                </p>
              </div>

              {/* Key Insights */}
              {results.aiReport.professionalReport.detailedAnalysis.keyInsights.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-purple-800 mb-3">Ключевые инсайты</h4>
                  <ul className="space-y-2">
                    {results.aiReport.professionalReport.detailedAnalysis.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-purple-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations by Priority */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h5 className="font-semibold text-red-800 mb-3">Немедленные действия</h5>
                  <ul className="space-y-2">
                    {results.aiReport.professionalReport.recommendations.immediate.map((rec, index) => (
                      <li key={index} className="text-sm text-red-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h5 className="font-semibold text-yellow-800 mb-3">Краткосрочные (1-3 месяца)</h5>
                  <ul className="space-y-2">
                    {results.aiReport.professionalReport.recommendations.shortTerm.map((rec, index) => (
                      <li key={index} className="text-sm text-yellow-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-green-800 mb-3">Долгосрочные (3+ месяца)</h5>
                  <ul className="space-y-2">
                    {results.aiReport.professionalReport.recommendations.longTerm.map((rec, index) => (
                      <li key={index} className="text-sm text-green-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          {results.aiReport.nextSteps.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <ChevronRight className="w-6 h-6 text-indigo-500" />
                <span>Следующие шаги</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {results.aiReport.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-indigo-800">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Score Distribution */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Распределение баллов</h3>
            
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium text-gray-700">{category.title}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className={`h-6 rounded-full bg-gradient-to-r ${getScoreColor(category.data.score)} flex items-center justify-end pr-3`}
                      style={{ width: `${(category.data.score / category.data.maxScore) * 100}%` }}
                    >
                      <span className="text-white text-sm font-medium">{category.data.score}</span>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {Math.round((category.data.score / category.data.maxScore) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Сильные стороны</h4>
              <div className="space-y-3">
                {categories
                  .filter(cat => (cat.data.score / cat.data.maxScore) >= 0.8)
                  .map((cat, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <cat.icon className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{cat.title}</span>
                      <span className="text-green-600 font-medium">
                        {Math.round((cat.data.score / cat.data.maxScore) * 100)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Области для улучшения</h4>
              <div className="space-y-3">
                {categories
                  .filter(cat => (cat.data.score / cat.data.maxScore) < 0.8)
                  .map((cat, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <cat.icon className="w-5 h-5 text-orange-500" />
                      <span className="text-gray-700">{cat.title}</span>
                      <span className="text-orange-600 font-medium">
                        {Math.round((cat.data.score / cat.data.maxScore) * 100)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* AI Enhancement Status */}
          {results.aiReport && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>AI Enhancement Status</span>
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-purple-700">Google Gemini AI активен</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-purple-700">Профессиональный отчет сгенерирован</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-purple-700">Персональные рекомендации готовы</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;