import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, Zap, Video, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface UploadSectionProps {
  onFileUpload: (file: File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]?.type.startsWith('video/')) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]?.type.startsWith('video/')) {
      setUploadedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide mb-2">
          <Sparkles className="w-3 h-3" />
          AI-Magic is on
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Улучшайте навыки преподавания <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            с помощью Искусственного Интеллекта
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Загрузите видео урока. Наш AI проанализирует 1000+ параметров: от микровыражений лица до структуры речи и вовлеченности аудитории.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-3">
          <div 
            className={`relative group h-full min-h-[400px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden bg-white shadow-sm ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!uploadedFile ? (
              <div className="text-center p-10 z-10">
                <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Перетащите видео сюда</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                  MP4, MOV, AVI (макс. 500 МБ)<br/>
                  Рекомендуемая длительность: 10-15 мин
                </p>
                <label className="relative inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 bg-slate-900 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                  Выбрать файл вручную
                  <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-10 bg-white">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <FileVideo className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 truncate max-w-md">{uploadedFile.name}</h3>
                <p className="text-slate-500 mb-8">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Готово к анализу
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setUploadedFile(null)}
                    className="px-6 py-3 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={() => onFileUpload(uploadedFile)}
                    className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                  >
                    Запустить AI Анализ
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>
        </div>

        {/* Features Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {[
            { title: "MediaPipe Tracking", desc: "33 точки тела, 468 точек лица", icon: Video, color: "text-blue-600 bg-blue-50" },
            { title: "Voice Analysis", desc: "Тон, темп, слова-паразиты", icon: Zap, color: "text-amber-600 bg-amber-50" },
            { title: "Secure Processing", desc: "Данные не сохраняются", icon: ShieldCheck, color: "text-green-600 bg-green-50" },
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-xl ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{feature.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
              </div>
            </div>
          ))}
          
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white mt-4">
            <h4 className="font-bold text-lg mb-2">Как это работает?</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Мы используем комбинацию компьютерного зрения и LLM для создания психологического и профессионального портрета преподавателя за секунды.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;