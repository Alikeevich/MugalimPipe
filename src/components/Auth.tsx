import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from './icons';
import { supabase } from '../supabase';

interface AuthProps {
  onLoggedIn?: () => void;
}

export default function Auth({ onLoggedIn }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessageType('success');
        setMessage('Проверьте email для подтверждения');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLoggedIn?.();
      }
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-12 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="liquid-glass p-6 sm:p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ backgroundColor: 'var(--surface-3)', border: '1px solid var(--hairline)' }}>
              <img src="/logo-book.png" alt="MugalimPipe" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-700 text-[var(--text-primary)] mb-2">
              {isSignUp ? 'Создать аккаунт' : 'С возвращением!'}
            </h1>
            <p className="text-sm sm:text-[var(--text-secondary)]">
              {isSignUp ? 'Начните анализировать свои уроки' : 'Войдите для продолжения'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-500 text-[var(--text-primary)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '45px' }}
                  className="liquid-input w-full text-sm sm:text-base"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-500 text-[var(--text-primary)] mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '45px' }}
                  className="liquid-input w-full text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className="text-sm p-3 rounded-lg border" style={
                messageType === 'success'
                  ? { backgroundColor: 'rgba(111,168,118,0.12)', borderColor: 'rgba(111,168,118,0.3)', color: 'var(--green)' }
                  : { backgroundColor: 'rgba(184,68,85,0.12)', borderColor: 'rgba(184,68,85,0.3)', color: 'var(--accent-light)' }
              }>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 liquid-button liquid-button-primary font-600 text-base sm:text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Загрузка...' : (
                <>
                  {isSignUp ? 'Создать аккаунт' : 'Войти'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
            >
              {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
