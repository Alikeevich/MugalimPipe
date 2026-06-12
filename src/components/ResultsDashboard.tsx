import React, { useState, useEffect } from 'react';
import { BarChart3, Star, Download, RotateCcw, Target, Users, Brain, MessageSquare, BookOpen, Award } from './icons';
import { ComprehensiveAnalysis } from '../services/ScoringService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

interface ResultsDashboardProps {
  results: ComprehensiveAnalysis;
  onReset: () => void;
  onSaveReport?: (pdfBlob: Blob, fileName: string) => Promise<void>;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, onReset, onSaveReport }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'analytics'>('overview');
  const [saving, setSaving] = useState(false);

  // Debug - выводим данные в консоль
  useEffect(() => {
    console.log('📊 ResultsDashboard Data:', {
      totalScore: results.totalScore,
      percentage: results.percentage,
      strengths: results.strengths,
      priorityAreas: results.priorityAreas,
      hasAiReport: !!results.aiReport,
      metrics: {
        posture: results.metrics.posture,
        speech: results.metrics.speech
      }
    });
  }, [results]);

  // Проверка на валидность данных
  if (!results || !results.metrics) {
    console.error('❌ ResultsDashboard: Invalid results data');
    return (
      <div className="liquid-glass p-8 text-center">
        <h2 className="text-2xl font-700 text-[var(--text-primary)] mb-4">Ошибка загрузки результатов</h2>
        <p className="text-[var(--text-secondary)] mb-6">Данные анализа повреждены</p>
        <button onClick={onReset} className="liquid-button liquid-button-primary px-6 py-3">
          Попробовать снова
        </button>
      </div>
    );
  }

  // Функция для получения сильных сторон
  const getStrengths = (data: any): string[] => {
    console.log('🔍 getStrengths called with:', data);
    // Пробуем разные поля где могут быть сильные стороны
    if (data.strengths && data.strengths.length > 0) {
      console.log('✅ Found strengths:', data.strengths);
      return data.strengths;
    }
    if (data.positiveAspects && data.positiveAspects.length > 0) return data.positiveAspects;
    if (data.goodPoints && data.goodPoints.length > 0) return data.goodPoints;
    // Если нет явных сильных сторон, берем первые рекомендации как позитивные
    if (data.recommendations && data.recommendations.length > 0) {
      return data.recommendations.slice(0, 2);
    }
    console.log('⚠️ No strengths found, returning empty array');
    return [];
  };

  // Функция для получения зон роста/рекомендаций
  const getImprovements = (data: any): string[] => {
    console.log('🔍 getImprovements called with:', data);
    // Пробуем разные поля где могут быть рекомендации
    if (data.areasForImprovement && data.areasForImprovement.length > 0) {
      console.log('✅ Found areasForImprovement:', data.areasForImprovement);
      return data.areasForImprovement;
    }
    if (data.issues && data.issues.length > 0) return data.issues;
    if (data.aiRecommendations && data.aiRecommendations.length > 0) return data.aiRecommendations;
    if (data.improvementSuggestions && data.improvementSuggestions.length > 0) return data.improvementSuggestions;
    // Если нет явных рекомендаций, берем остальные рекомендации
    if (data.recommendations && data.recommendations.length > 2) {
      return data.recommendations.slice(2, 5);
    }
    console.log('⚠️ No improvements found, returning empty array');
    return [];
  };

  const radarData = [
    { subject: 'Поза', A: results.metrics.posture.score, fullMark: 200 },
    { subject: 'Жесты', A: results.metrics.gesticulation.score, fullMark: 200 },
    { subject: 'Мимика', A: results.metrics.facial.score, fullMark: 200 },
    { subject: 'Речь', A: results.metrics.speech.score, fullMark: 200 },
    { subject: 'Вовлеченность', A: results.metrics.engagement.score, fullMark: 200 },
  ];

  const barData = [
    { name: 'Поза', score: results.metrics.posture.score, max: 200, percentage: Math.round((results.metrics.posture.score / 200) * 100) },
    { name: 'Жесты', score: results.metrics.gesticulation.score, max: 200, percentage: Math.round((results.metrics.gesticulation.score / 200) * 100) },
    { name: 'Мимика', score: results.metrics.facial.score, max: 200, percentage: Math.round((results.metrics.facial.score / 200) * 100) },
    { name: 'Речь', score: results.metrics.speech.score, max: 200, percentage: Math.round((results.metrics.speech.score / 200) * 100) },
    { name: 'Вовлеченность', score: results.metrics.engagement.score, max: 200, percentage: Math.round((results.metrics.engagement.score / 200) * 100) },
  ];

  const generatePDFReport = async (saveToDb: boolean = false) => {
    try {
      setSaving(true);
      
      console.log('📄 Generating PDF...', {
        hasAiReport: !!results.aiReport,
        totalScore: results.totalScore,
        strengths: results.strengths?.length,
        priorityAreas: results.priorityAreas?.length
      });

      const reportElement = document.createElement('div');
      reportElement.style.width = '800px';
      reportElement.style.padding = '40px';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      reportElement.style.backgroundColor = 'white';
      reportElement.style.color = 'black';

      // Используем AI отчет ИЛИ fallback данные
      const aiReport = results.aiReport;
      const pr: any = aiReport?.professionalReport;
      const hasAiReport = pr;
      
      reportElement.innerHTML = `
        <div style="text-align:center;margin-bottom:30px;">
          <h1 style="font-size:28px;margin-bottom:10px;color:#9B2D3C;">MugalimPipe - Анализ урока</h1>
          <p style="font-size:18px;color:#666;">Результаты анализа</p>
        </div>
        
        <div style="background:#f5f5f7;padding:20px;border-radius:12px;margin-bottom:30px;">
          <div style="text-align:center;margin-bottom:15px;">
            <div style="font-size:48px;font-weight:700;color:#9B2D3C;margin-bottom:5px;">${results.totalScore}/1000</div>
            <div style="font-size:18px;color:#666;">Общий балл (${results.grade})</div>
          </div>
          <div style="display:flex;justify-content:space-around;text-align:center;">
            <div>
              <div style="font-size:24px;font-weight:600;color:#9B2D3C;">${results.percentage.toFixed(1)}%</div>
              <div style="font-size:12px;color:#999;">Процент</div>
            </div>
          </div>
        </div>

        ${hasAiReport ? `
          <div style="margin-bottom:30px;">
            <h2 style="font-size:20px;color:#9B2D3C;margin-bottom:15px;border-bottom:2px solid #9B2D3C;padding-bottom:5px;">Резюме</h2>
            <p style="line-height:1.6;color:#333;">${pr.executiveSummary || 'Нет данных'}</p>
          </div>

          <div style="margin-bottom:30px;">
            <h2 style="font-size:20px;color:#9B2D3C;margin-bottom:15px;border-bottom:2px solid #9B2D3C;padding-bottom:5px;">Сильные стороны</h2>
            <ul style="line-height:1.8;color:#333;">
              ${(pr.detailedAnalysis.strengths || []).map((s: string) => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom:30px;">
            <h2 style="font-size:20px;color:#9B2D3C;margin-bottom:15px;border-bottom:2px solid #9B2D3C;padding-bottom:5px;">Зоны роста</h2>
            <ul style="line-height:1.8;color:#333;">
              ${(pr.detailedAnalysis.areasForImprovement || []).map((a: string) => `<li>${a}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom:30px;">
            <h2 style="font-size:20px;color:#9B2D3C;margin-bottom:15px;border-bottom:2px solid #9B2D3C;padding-bottom:5px;">Рекомендации</h2>
            
            <h3 style="font-size:16px;color:#666;margin:15px 0 8px 0;">Немедленные действия:</h3>
            <ul style="line-height:1.6;color:#333;">
              ${(pr.recommendations.immediate || []).map((r: string) => `<li>${r}</li>`).join('')}
            </ul>

            <h3 style="font-size:16px;color:#666;margin:15px 0 8px 0;">Краткосрочные цели:</h3>
            <ul style="line-height:1.6;color:#333;">
              ${(pr.recommendations.shortTerm || []).map((r: string) => `<li>${r}</li>`).join('')}
            </ul>

            <h3 style="font-size:16px;color:#666;margin:15px 0 8px 0;">Долгосрочные цели:</h3>
            <ul style="line-height:1.6;color:#333;">
              ${(pr.recommendations.longTerm || []).map((r: string) => `<li>${r}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom:30px;">
            <h2 style="font-size:20px;color:#9B2D3C;margin-bottom:15px;border-bottom:2px solid #9B2D3C;padding-bottom:5px;">План действий</h2>
            
            <h3 style="font-size:16px;color:#666;margin:15px 0 8px 0;">Неделя 1:</h3>
            <ul style="line-height:1.6;color:#333;">
              ${(pr.actionPlan.week1 || []).map((a: string) => `<li>${a}</li>`).join('')}
            </ul>

            <h3 style="font-size:16px;color:#666;margin:15px 0 8px 0;">Неделя 2:</h3>
            <ul style="line-height:1.6;color:#333;">
              ${(pr.actionPlan.week2 || []).map((a: string) => `<li>${a}</li>`).join('')}
            </ul>

            <h3 style="font-size:16px;color:#666;margin:15px 0 8px 0;">Неделя 3:</h3>
            <ul style="line-height:1.6;color:#333;">
              ${(pr.actionPlan.week3 || []).map((a: string) => `<li>${a}</li>`).join('')}
            </ul>

            <h3 style="font-size:16px;color:#666;margin:15px 0 8px 0;">Неделя 4:</h3>
            <ul style="line-height:1.6;color:#333;">
              ${(pr.actionPlan.week4 || []).map((a: string) => `<li>${a}</li>`).join('')}
            </ul>
          </div>

          <div style="background:#f5f5f7;padding:20px;border-radius:12px;margin-top:30px;">
            <p style="font-style:italic;line-height:1.6;color:#666;text-align:center;">${aiReport?.motivationalMessage || ''}</p>
          </div>
        ` : `
          <div style="margin-bottom:30px;">
            <h2 style="font-size:20px;color:#9B2D3C;margin-bottom:15px;border-bottom:2px solid #9B2D3C;padding-bottom:5px;">Сильные стороны</h2>
            <ul style="line-height:1.8;color:#333;">
              ${(results.strengths || ['Анализ завершен', 'Данные обрабатываются']).map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom:30px;">
            <h2 style="font-size:20px;color:#9B2D3C;margin-bottom:15px;border-bottom:2px solid #9B2D3C;padding-bottom:5px;">Зоны роста</h2>
            <ul style="line-height:1.8;color:#333;">
              ${(results.priorityAreas || ['Продолжать развитие', 'Работать над навыками']).map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>

          <div style="background:#f5f5f7;padding:20px;border-radius:12px;margin-top:30px;">
            <p style="font-style:italic;line-height:1.6;color:#666;text-align:center;">Продолжайте совершенствоваться! Каждый урок - возможность стать лучше.</p>
          </div>
        `}

        <div style="margin-top:40px;padding-top:20px;border-top:1px solid #ddd;text-align:center;color:#999;font-size:12px;">
          <p>Сгенерировано MugalimPipe ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
      `;

      document.body.appendChild(reportElement);
      
      console.log('📸 Creating canvas from HTML...');
      const canvas = await html2canvas(reportElement, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(reportElement);
      
      console.log('📄 Creating PDF...');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Добавляем первую страницу
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Добавляем дополнительные страницы если нужно
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `AI-отчет-${new Date().toISOString().split('T')[0]}.pdf`;

      console.log('💾 PDF created, saving...', { fileName, size: pdfBlob.size });

      if (saveToDb && onSaveReport) {
        await onSaveReport(pdfBlob, fileName);
      }

      // Скачиваем PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ PDF downloaded successfully');
      
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      alert('Ошибка PDF: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { key: 'posture', title: 'Поза и осанка', icon: Target, data: results.metrics.posture, description: 'Осанка и уверенность' },
    { key: 'gesticulation', title: 'Жестикуляция', icon: Users, data: results.metrics.gesticulation, description: 'Выразительность жестов' },
    { key: 'facial', title: 'Мимика', icon: Brain, data: results.metrics.facial, description: 'Зрительный контакт' },
    { key: 'speech', title: 'Речь', icon: BookOpen, data: results.metrics.speech, description: 'Дикция и темп' },
    { key: 'engagement', title: 'Вовлеченность', icon: MessageSquare, data: results.metrics.engagement, description: 'Харизма и внимание' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 sm:mb-8">
        <div className="liquid-glass liquid-button-primary w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-700 tracking-tight text-[var(--text-primary)] mb-2">Результаты</h1>
        {results.aiReport && (
          <div className="liquid-badge inline-flex">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
            <span className="text-[10px] sm:text-xs font-600 uppercase tracking-[0.14em] text-[var(--text-secondary)]">Отчёт ИИ</span>
          </div>
        )}
        <p className="text-sm sm:text-lg text-[var(--text-secondary)] mt-3 sm:mt-4 px-2">
          Ваш результат: <span className="text-xl sm:text-2xl font-700 text-gradient">{results.totalScore}/1000</span> баллов
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mb-6 sm:mb-8 px-2">
        <div className="liquid-glass p-1.5 sm:p-2 inline-flex flex-wrap justify-center gap-1">
          {(['overview', 'analytics', 'detailed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-700 transition-all whitespace-nowrap ${
                activeTab === tab ? 'liquid-button liquid-button-primary' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'overview' && 'Обзор'}
              {tab === 'analytics' && 'Графики'}
              {tab === 'detailed' && 'Детали'}
            </button>
          ))}
        </div>
      </motion.div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass p-4 sm:p-6 md:p-8 lg:p-10 mb-4 sm:mb-6">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 items-center">
            {/* Score Circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-[var(--accent)] via-[var(--accent-light)] to-[var(--accent-dark)] shadow-lg flex items-center justify-center">
                <div className="text-center z-10">
                  <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-700 text-white">{results.totalScore}</motion.span>
                  <div className="text-white/70 text-[10px] sm:text-xs uppercase mt-1 px-2">из 1000 баллов</div>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 text-xl sm:text-2xl font-700 text-gradient">{results.percentage.toFixed(1)}%</div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">Ваш результат</p>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <h2 className="text-base sm:text-xl md:text-2xl font-600 text-[var(--text-primary)] px-2">{results.aiReport?.professionalReport?.executiveSummary || results.overallFeedback}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-[10px] sm:text-xs font-700 uppercase text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent)]" /> Сильные стороны
                  </h3>
                  {(results.aiReport?.professionalReport?.detailedAnalysis?.strengths || results.strengths).slice(0, 4).map((s: string, i: number) => (
                    <div key={i} className="flex items-start text-xs sm:text-sm text-[var(--text-primary)] mb-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[var(--accent)] rounded-full mr-2 sm:mr-3 mt-1.5 flex-shrink-0"></div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-[10px] sm:text-xs font-700 uppercase text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent)]" /> Для улучшения
                  </h3>
                  {(results.aiReport?.professionalReport?.detailedAnalysis?.areasForImprovement || results.priorityAreas).slice(0, 4).map((a: string, i: number) => (
                    <div key={i} className="flex items-start text-xs sm:text-sm text-[var(--text-primary)] mb-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[var(--accent)]/50 rounded-full mr-2 sm:mr-3 mt-1.5 flex-shrink-0"></div>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[var(--glass-border)]">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={() => generatePDFReport(false)} disabled={saving} className="liquid-button liquid-button-primary px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{saving ? '...' : 'Скачать отчет'}</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={() => generatePDFReport(true)} disabled={saving} className="liquid-button px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{saving ? '...' : 'В профиль'}</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={onReset} className="liquid-button px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none justify-center">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Новый анализ</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Radar */}
          <div className="liquid-glass p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-600 text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Radar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" /> Диаграмма
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 200]} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                  <Radar name="Результат" dataKey="A" stroke="#9B2D3C" strokeWidth={2} fill="#9B2D3C" fillOpacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(28,28,30,0.9)', border: 'none', borderRadius: '12px', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar */}
          <div className="liquid-glass p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-600 text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" /> Сравнение
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                  <YAxis domain={[0, 200]} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(28,28,30,0.9)', border: 'none', borderRadius: '12px', fontSize: 12 }} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={['#9B2D3C', '#D2A24C', '#6FA876', '#5E3550', '#3D5A66'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Cards */}
          {categories.map((cat, i) => (
            <motion.div key={cat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.02 }} className="liquid-glass p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="liquid-glass w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                    <cat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-600 text-[var(--text-primary)] text-sm sm:text-base truncate">{cat.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{cat.data.score}/{cat.data.maxScore}</p>
                  </div>
                </div>
              </div>
              <div className="liquid-glass h-2 sm:h-2.5 rounded-full overflow-hidden">
                <motion.div className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${(cat.data.score / cat.data.maxScore) * 100}%` }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeTab === 'detailed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 sm:space-y-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="liquid-glass p-4 sm:p-6"
            >
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="liquid-glass liquid-button-primary w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <cat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl font-700 text-[var(--text-primary)] mb-1 truncate">{cat.title}</h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">{cat.description}</p>
                    <div className="flex items-center gap-2 sm:gap-3 mt-2">
                      <span className="text-base sm:text-lg font-700 text-gradient">{cat.data.score}</span>
                      <span className="text-xs sm:text-sm text-[var(--text-tertiary)]">из {cat.data.maxScore}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg sm:text-2xl font-700 text-gradient">{Math.round((cat.data.score / cat.data.maxScore) * 100)}%</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="liquid-glass h-2 sm:h-3 rounded-full overflow-hidden mb-4 sm:mb-6">
                <motion.div
                  className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-light)] to-[var(--accent-dark)] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.data.score / cat.data.maxScore) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="liquid-glass p-3 sm:p-4">
                  <h4 className="text-[10px] sm:text-xs font-700 uppercase text-[var(--accent)] mb-3 flex items-center gap-2">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4" /> Сильные стороны
                  </h4>
                  <ul className="space-y-2">
                    {/* Сильные стороны из метрик */}
                    {getStrengths(cat.data).length > 0 ? (
                      getStrengths(cat.data).slice(0, 3).map((r: string, j: number) => (
                        <li key={j} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--text-primary)]">
                          <span className="text-[var(--accent)] mt-1 flex-shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs sm:text-sm text-[var(--text-tertiary)]">Нет данных</li>
                    )}
                  </ul>
                </div>
                <div className="liquid-glass p-3 sm:p-4">
                  <h4 className="text-[10px] sm:text-xs font-700 uppercase text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4" /> Зоны роста
                  </h4>
                  <ul className="space-y-2">
                    {/* Рекомендации по улучшению */}
                    {getImprovements(cat.data).length > 0 ? (
                      getImprovements(cat.data).slice(0, 3).map((r: string, j: number) => (
                        <li key={j} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--text-primary)]">
                          <span className="text-[var(--text-tertiary)] mt-1 flex-shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs sm:text-sm text-[var(--text-tertiary)]">Нет данных</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ResultsDashboard;
