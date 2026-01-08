import React, { useState } from 'react';
import { Brain, Users, TrendingUp, Sparkles, LayoutDashboard } from 'lucide-react';
import UploadSection from './components/UploadSection';
import AnalysisProgress from './components/AnalysisProgress';
import ResultsDashboard from './components/ResultsDashboard';
import LanguageSelector from './components/LanguageSelector';
import { languageService, type SupportedLanguage } from './services/LanguageService';

function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('ru');

  const handleLanguageChange = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    languageService.setLanguage(language);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setCurrentStep('analyzing');
  };

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results);
    setCurrentStep('results');
  };

  const resetApp = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setAnalysisResults(null);
  };

  const texts = languageService.getText();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/50 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={resetApp}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75 blur transition duration-200 group-hover:opacity-100"></div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Brain className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Lesson<span className="text-indigo-600">AI</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Улучшайте свои педагогические навыки с помощью MediaPipe и ИИ</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600 bg-slate-100/50 px-4 py-1.5 rounded-full border border-slate-200/50">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>2.4k+ Teachers</span>
              </div>
              <div className="w-px h-4 bg-slate-300"></div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>+85% Efficiency</span>
              </div>
            </div>
            
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="transition-all duration-500 ease-in-out">
          {currentStep === 'upload' && (
            <UploadSection onFileUpload={handleFileUpload} />
          )}
          
          {currentStep === 'analyzing' && uploadedFile && (
            <AnalysisProgress 
              fileName={uploadedFile.name} 
              onAnalysisComplete={handleAnalysisComplete}
              videoFile={uploadedFile}
            />
          )}
          
          {currentStep === 'results' && analysisResults && (
            <ResultsDashboard results={analysisResults} onReset={resetApp} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;