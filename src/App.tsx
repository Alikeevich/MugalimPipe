import React, { useState } from 'react';
import { Upload, BarChart3, Brain, Users, Target, TrendingUp } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {texts.appTitle}
                </h1>
                <p className="text-sm text-gray-600">{texts.appSubtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{texts.teachersCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{texts.improvementRate}</span>
                </div>
              </div>
              
              <LanguageSelector 
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      </main>

      {/* Features Section - только на главной странице */}
      {currentStep === 'upload' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {texts.featuresTitle}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {texts.featuresSubtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: texts.features.poseAnalysis.title,
                description: texts.features.poseAnalysis.description,
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: texts.features.gestureRecognition.title,
                description: texts.features.gestureRecognition.description,
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Brain,
                title: texts.features.facialAnalysis.title,
                description: texts.features.facialAnalysis.description,
                color: "from-green-500 to-teal-500"
              },
              {
                icon: BarChart3,
                title: texts.features.speechAnalysis.title,
                description: texts.features.speechAnalysis.description,
                color: "from-orange-500 to-red-500"
              },
              {
                icon: Upload,
                title: texts.features.contentClassification.title,
                description: texts.features.contentClassification.description,
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: TrendingUp,
                title: texts.features.recommendations.title,
                description: texts.features.recommendations.description,
                color: "from-pink-500 to-rose-500"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/90 transition-all duration-300 hover:scale-105">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;