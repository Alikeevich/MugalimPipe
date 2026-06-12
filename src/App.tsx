import { useState, useEffect } from 'react';
import { CircleUser, LogOut, MessageCircle } from './components/icons';
import UploadSection from './components/UploadSection';
import AnalysisProgress from './components/AnalysisProgress';
import ResultsDashboard from './components/ResultsDashboard';
import LanguageSelector from './components/LanguageSelector';
import Auth from './components/Auth';
import Landing from './components/Landing';
import Profile from './components/Profile';
import { supabase } from './supabase';
import { languageService, type SupportedLanguage } from './services/LanguageService';
import type { ComprehensiveAnalysis } from './services/ScoringService';

// pages
import Pricing from './pages/Pricing.tsx';
import Termsandpolicies from './pages/Termsandpolicies.tsx';
import TermsOfService from './pages/TermsOfService.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import RefundPolicy from './pages/RefundPolicy.tsx';
import About from './pages/About.tsx';

function App() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<ComprehensiveAnalysis | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('ru');

  // auth session state
  const [session, setSession] = useState<any>(null);

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

  const handleSaveReport = async (pdfBlob: Blob, fileName: string) => {
    if (!session?.user) {
      alert('Пожалуйста, войдите в систему для сохранения отчета');
      return;
    }

    try {
      console.log('💾 Starting report save...', { 
        userId: session.user.id,
        hasAnalysisResults: !!analysisResults,
        hasAiReport: !!analysisResults?.aiReport 
      });

      // Создаем безопасный путь: user_id/date_filename.pdf
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const storagePath = `${session.user.id}/${new Date().toISOString().split('T')[0]}_${timestamp}_${safeFileName}`;

      // Пробуем загрузить PDF в storage (опционально)
      let publicUrl = '';
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(storagePath, pdfBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'application/pdf'
          });

        if (uploadError) {
          console.warn('⚠️ Storage upload failed, continuing without file:', uploadError);
        } else {
          console.log('✅ File uploaded to storage:', uploadData);
          const { data: { publicUrl: url } } = supabase.storage
            .from('reports')
            .getPublicUrl(storagePath);
          publicUrl = url || '';
          console.log('🔗 Public URL:', publicUrl);
        }
      } catch (storageError) {
        console.warn('⚠️ Storage error, continuing with database only:', storageError);
      }

      // Сохраняем отчет в базу данных (ОБЯЗАТЕЛЬНО)
      console.log('💾 Saving to database...');
      
      const insertData = {
        user_id: session.user.id,
        title: `Анализ урока от ${new Date().toLocaleDateString('ru-RU')}`,
        file_name: safeFileName,
        file_url: publicUrl || null,
        storage_path: publicUrl ? storagePath : null,
        total_score: analysisResults?.totalScore || 0,
        percentage: analysisResults?.percentage || 0,
        grade: analysisResults?.grade || 'N/A',
        metrics: analysisResults?.metrics || {},
        ai_report: analysisResults?.aiReport || {},
        strengths: analysisResults?.strengths || [],
        priority_areas: analysisResults?.priorityAreas || [],
        transcription: analysisResults?.metrics?.speech?.transcription || null,
        video_duration:
          (analysisResults as { analysisDetails?: { videoAnalysis?: { videoDuration?: number } } })
            ?.analysisDetails?.videoAnalysis?.videoDuration ?? null,
        status: 'completed' as const
      };

      console.log('📋 Insert data:', JSON.stringify(insertData, null, 2));

      const { data: dbData, error: dbError } = await supabase
        .from('reports')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        console.error('Error details:', JSON.stringify(dbError, null, 2));
        throw dbError;
      }

      console.log('✅ Report saved to database:', dbData);
      alert('Отчёт сохранён');
    } catch (error: any) {
      console.error('❌ Error saving report:', error);
      const errorMessage = error.message || 'Неизвестная ошибка';
      const errorDetails = error.details || error.hint || '';
      alert('Ошибка: ' + errorMessage + (errorDetails ? '\n' + errorDetails : ''));
    }
  };

  const texts = languageService.getText();

  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Background — тихий тёплый градиент без «орбов» */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% -10%, rgba(155,45,60,0.10), transparent 60%), var(--bg-primary)' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-14 sm:pt-16">

      {/* Top Navigation Bar - Liquid Glass Style */}
      <header className="fixed top-0 left-0 right-0 z-20 liquid-nav">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 sm:space-x-3 group"
            >
              <div className="liquid-glass w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src="/logo-book.png" alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
              </div>
              <div className="text-left">
                <h1 className="text-sm sm:text-base font-600 tracking-tight text-[var(--text-primary)] whitespace-nowrap">
                  {texts.appTitle}
                </h1>
                <p className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] uppercase tracking-wider hidden xs:block">
                  {texts.appSubtitle}
                </p>
              </div>
            </button>

            {/* Right side buttons */}
            <div className="flex items-center gap-2">
              {/* Language Selector - hidden on mobile */}
              <div className="hidden md:block">
                <LanguageSelector
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                />
              </div>

              {/* Not logged in */}
              {!session?.user ? (
                <div className="flex items-center gap-2">
                  {/* Support Button */}
                  <a
                    href="https://t.me/q4rzhas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-icon-btn"
                    title="Поддержка"
                  >
                    <MessageCircle strokeWidth={2} />
                  </a>
                  {/* Login Button */}
                  <button
                    onClick={() => navigate('/auth')}
                    className="nav-icon-btn nav-icon-btn-primary"
                    title="Войти"
                  >
                    <CircleUser strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Profile Button */}
                  <button
                    onClick={() => navigate('/profile')}
                    className="nav-icon-btn"
                    title="Профиль"
                  >
                    <CircleUser strokeWidth={2} />
                  </button>
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      supabase.auth.signOut();
                      setSession(null);
                    }}
                    className="nav-icon-btn"
                    title="Выход"
                  >
                    <LogOut strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {!session ? (
          route === '/auth' ? (
            <Auth />
          ) : route === '/about' ? (
            <About />
          ) : route === '/pricing' ? (
            <Pricing />
          ) : route === '/privacy-policy' ? (
            <PrivacyPolicy />
          ) : route === '/terms-of-service' ? (
            <TermsOfService />
          ) : route === '/refund-policy' ? (
            <RefundPolicy />
          ) : route === '/terms-and-policies' ? (
            <Termsandpolicies />
          ) : (
            <Landing onLoginClick={() => navigate('/auth')} />
          )
        ) : (
          route === '/profile' ? (
            <Profile session={session} />
          ) : route === '/pricing' ? (
            <Pricing />
          ) : route === '/privacy-policy' ? (
            <PrivacyPolicy />
          ) : route === '/terms-of-service' ? (
            <TermsOfService />
          ) : route === '/refund-policy' ? (
            <RefundPolicy />
          ) : route === '/terms-and-policies' ? (
            <Termsandpolicies />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="space-y-8">
                {currentStep === 'upload' && <UploadSection onFileSelect={handleFileUpload} />}
                {currentStep === 'analyzing' && uploadedFile && <AnalysisProgress file={uploadedFile} onComplete={handleAnalysisComplete} />}
                {currentStep === 'results' && analysisResults && (
                  <>
                    <ResultsDashboard results={analysisResults} onReset={resetApp} onSaveReport={handleSaveReport} />
                    <button
                      onClick={resetApp}
                      className="px-6 py-3 glass-button glass-button-primary font-600 w-full sm:w-auto"
                    >
                      Анализировать ещё видео
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 liquid-nav mt-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
              © 2026 {texts.appTitle}
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <button onClick={() => navigate('/about')} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                О нас
              </button>
              <button onClick={() => navigate('/pricing')} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                Тарифы
              </button>
              <button onClick={() => navigate('/privacy-policy')} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                Privacy
              </button>
              <button onClick={() => navigate('/terms-of-service')} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                Terms
              </button>
              <button onClick={() => navigate('/refund-policy')} className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                Refund
              </button>
            </nav>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default App;
