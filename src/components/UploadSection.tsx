import React, { useCallback, useState } from 'react';
import { Upload, Play, FileVideo, Clock, CheckCircle } from 'lucide-react';

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setUploadedFile(file);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setUploadedFile(file);
      }
    }
  };

  const handleAnalyze = () => {
    if (uploadedFile) {
      onFileUpload(uploadedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (file: File) => {
    // В реальном приложении здесь бы был код для получения длительности видео
    return "~12 мин";
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Проанализируйте свой урок
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            с помощью ИИ
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Загрузите видео своего урока (10-15 минут) и получите детальный анализ 
          вашей позы, жестикуляции, мимики и речи с персональными рекомендациями от ИИ
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
        {!uploadedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Upload className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Загрузите видео урока
                </h3>
                <p className="text-gray-600 mb-6">
                  Перетащите файл сюда или нажмите для выбора
                </p>
                
                <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl">
                  <FileVideo className="w-5 h-5 mr-2" />
                  Выбрать файл
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Поддерживаемые форматы: MP4, AVI, MOV, WebM</p>
                <p>Рекомендуемая длительность: 10-15 минут</p>
                <p>Максимальный размер: 500 МБ</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Preview */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {uploadedFile.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <FileVideo className="w-4 h-4 mr-1" />
                        {formatFileSize(uploadedFile.size)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDuration(uploadedFile)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setUploadedFile(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Analysis Features */}
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Анализ позы и осанки", icon: "🧍‍♂️" },
                { label: "Оценка жестикуляции", icon: "👋" },
                { label: "Анализ мимики", icon: "😊" },
                { label: "Словарный запас", icon: "📚" },
                { label: "Структура речи", icon: "🗣️" },
                { label: "ИИ рекомендации", icon: "🤖" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-gray-700">{feature.label}</span>
                </div>
              ))}
            </div>
            
            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
            >
              <Play className="w-6 h-6" />
              <span>Начать анализ урока</span>
            </button>
            
            <p className="text-center text-sm text-gray-500">
              Анализ займет около 2-3 минут. Мы используем передовые технологии MediaPipe и Google Gemini AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSection;