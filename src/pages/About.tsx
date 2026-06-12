import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, Sparkles, Shield, Heart } from '../components/icons';

export default function About() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Анализ',
      description: 'Используем передовые модели искусственного интеллекта для детального анализа ваших педагогических навыков',
      color: 'from-[var(--accent)] to-[var(--gold)]'
    },
    {
      icon: Target,
      title: 'Точность',
      description: 'Наши алгоритмы анализируют более 50 параметров вашего выступления для максимальной точности оценки',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      title: 'Персонализация',
      description: 'Каждый пользователь получает индивидуальные рекомендации на основе своих уникальных особенностей',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Прогресс',
      description: 'Отслеживайте свой прогресс с течением времени и наблюдайте за улучшением своих навыков',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const team = [
    { name: 'Наша миссия', description: 'Помочь каждому педагогу раскрыть свой потенциал через инновационные технологии анализа' },
    { name: 'Наше видение', description: 'Создать мир, где каждый учитель имеет доступ к профессиональной обратной связи' },
    { name: 'Наши ценности', description: 'Качество, инновации, доступность и постоянное совершенствование' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% -10%, rgba(155,45,60,0.10), transparent 60%), var(--bg-primary)' }}></div>
      </div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 pt-20 pb-16 px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="liquid-glass w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          >
            <Sparkles className="w-10 h-10 text-[var(--accent)]" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-700 tracking-tight mb-6"
          >
            О платформе{' '}
            <span className="text-gradient">MugalimPipe</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed"
          >
            Инновационная платформа для анализа и улучшения педагогических навыков с использованием искусственного интеллекта
          </motion.p>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 py-16 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-700 tracking-tight text-center mb-12 text-[var(--text-primary)]">
            Наша философия
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {team.map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="liquid-glass p-6"
              >
                <div className="liquid-glass w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-600 text-[var(--text-primary)] mb-3">{item.name}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative z-10 py-16 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-700 tracking-tight text-center mb-4 text-[var(--text-primary)]">
            Почему выбирают нас
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-12 max-w-2xl mx-auto">
            Мы объединяем технологии и педагогику для достижения лучших результатов
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ x: index % 2 === 0 ? -30 : 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="liquid-glass p-6"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg glow`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-600 text-[var(--text-primary)] mb-3">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Trust Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="relative z-10 py-16 px-4"
      >
        <div className="max-w-4xl mx-auto liquid-glass p-8 md:p-12">
          <div className="text-center">
            <div className="liquid-glass w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-700 text-[var(--text-primary)] mb-4">
              Безопасность и конфиденциальность
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Мы используем современные методы шифрования данных и строго соблюдаем политику конфиденциальности. Ваши видео и персональные данные надежно защищены.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
