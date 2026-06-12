import React, { useCallback, useState, useRef } from 'react';
import {
  Upload,
  Play,
  FileVideo,
  CheckCircle,
  X,
  PersonStanding,
  Hand,
  ScanFace,
  Speech,
  Star,
  FileText,
  Trash2
} from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ✅ БАГ 4.3 ИСПРАВЛЕН: храним ссылку на текущий Object URL,
  // чтобы всегда иметь возможность его отозвать
  const currentObjectUrl = useRef<string | null>(null);

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
        handleFile(file);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // ✅ БАГ 4.3 ИСПРАВЛЕН: если пользователь загружает новый файл поверх старого,
    // освобождаем предыдущий Object URL, чтобы не засорять память браузера
    if (currentObjectUrl.current) {
      URL.revokeObjectURL(currentObjectUrl.current);
      currentObjectUrl.current = null;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    const url = URL.createObjectURL(file);
    currentObjectUrl.current = url; // ← запоминаем для будущего освобождения
    setVideoPreview(url);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleAnalyze = () => {
    if (uploadedFile) {
      onFileSelect(uploadedFile);
    }
  };

  const handleRemoveFile = () => {
    // ✅ БАГ 4.3 ИСПРАВЛЕН: освобождаем URL при явном удалении файла
    if (currentObjectUrl.current) {
      URL.revokeObjectURL(currentObjectUrl.current);
      currentObjectUrl.current = null;
    }
    setUploadedFile(null);
    setVideoPreview(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass p-4 sm:p-6 md:p-8 lg:p-12"
      >
        <AnimatePresence mode="wait">
          {!uploadedFile ? (
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--glass-border)] hover:border-[var(--accent)]/50 hover:bg-[var(--glass-bg)]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 sm:w-16 sm:h-16 liquid-glass liquid-button-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </motion.div>

                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-600 text-[var(--text-primary)] mb-2">
                    Загрузите видео урока
                  </h3>
                  <p className="text-sm sm:text-[var(--text-secondary)]">
                    Перетащите файл сюда или выберите на диске
                  </p>
                </div>

                <label className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 liquid-button liquid-button-primary font-600 cursor-pointer text-sm sm:text-base">
                  <FileVideo className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Выбрать файл
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">
                  MP4, AVI, MOV • до 500 МБ
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Video Preview */}
              {videoPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative liquid-glass rounded-xl sm:rounded-2xl overflow-hidden"
                >
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full max-h-48 sm:max-h-64 md:max-h-80 object-contain bg-black"
                    controls
                    muted
                  />
                  {!isUploading && (
                    <button
                      onClick={handleRemoveFile}
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 liquid-glass hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    </button>
                  )}
                </motion.div>
              )}

              {/* File Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="liquid-glass p-3 sm:p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 liquid-glass liquid-button-primary rounded-xl flex items-center justify-center">
                      {isUploading ? (
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-bounce" />
                      ) : (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-600 text-[var(--text-primary)] text-sm sm:text-base truncate">
                        {uploadedFile.name}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center flex-shrink-0">
                          <FileVideo className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {formatFileSize(uploadedFile.size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isUploading && (
                    <button
                      onClick={handleRemoveFile}
                      className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 liquid-glass flex items-center justify-center hover:bg-[var(--glass-bg)] transition-all"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-secondary)]" />
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-3 sm:mt-4">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs mb-2">
                      <span className="text-[var(--text-secondary)]">Загрузка...</span>
                      <span className="font-600 text-[var(--accent)]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5 sm:h-2 overflow-hidden" style={{ backgroundColor: 'var(--surface-3)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-light))' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Analysis Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3"
              >
                {[
                  { label: "Поза", icon: PersonStanding },
                  { label: "Жесты", icon: Hand },
                  { label: "Мимика", icon: ScanFace },
                  { label: "Речь", icon: Speech },
                  { label: "Вовлечённость", icon: Star },
                  { label: "Отчёт", icon: FileText }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="liquid-glass p-2 sm:p-3 flex items-center space-x-2 sm:space-x-3"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 liquid-glass rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent)]" />
                    </div>
                    <span className="text-xs sm:text-sm font-500 text-[var(--text-primary)] truncate">
                      {feature.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Analyze Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={isUploading}
                className="w-full py-3 sm:py-4 liquid-button liquid-button-primary font-600 text-base sm:text-lg disabled:opacity-50"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  <span className="text-sm sm:text-base">Начать анализ</span>
                </div>
              </motion.button>

              <p className="text-center text-[10px] sm:text-xs text-[var(--text-tertiary)] tracking-wide">
                Анализ занимает 2–3 минуты
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UploadSection;