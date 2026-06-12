import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Video, Brain, BarChart3 } from './icons';

interface LandingProps {
  onLoginClick: () => void;
}

export default function Landing({ onLoginClick }: LandingProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-12 sm:py-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-5xl mx-auto w-full"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
            <div className="liquid-badge inline-flex">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
              <span className="text-[10px] sm:text-xs font-600 uppercase tracking-[0.18em] text-[var(--text-secondary)]">Enactus Margulan</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-800 tracking-tight mb-4 sm:mb-6 text-gradient"
          >
            MugalimPipe
          </motion.h1>

          {/* Subtitle */}
          <motion.h2
            variants={itemVariants}
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-700 tracking-tight text-[var(--text-primary)] mb-6 sm:mb-8 px-2"
          >
            Объективная оценка <span className="text-gradient">педагогического мастерства</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-[var(--text-secondary)] mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Загрузите запись урока — система разберёт позу, жесты, мимику и речь
            и вернёт понятный отчёт с конкретными шагами для роста.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 px-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLoginClick}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 liquid-button liquid-button-primary text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3"
            >
              Начать анализ
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Features */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 px-3 sm:px-0">
            {[
              {
                icon: Video,
                title: 'Загрузите урок',
                description: 'Запись занятия или выступления в любом распространённом формате'
              },
              {
                icon: Brain,
                title: 'Разбор по кадрам',
                description: 'Поза, жесты, мимика и речь анализируются покадрово и по аудио'
              },
              {
                icon: BarChart3,
                title: 'Понятный отчёт',
                description: 'Оценка по 1000-балльной шкале и конкретные шаги для роста'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="liquid-glass p-5 sm:p-8 text-left"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5"
                     style={{ backgroundColor: 'var(--surface-3)', border: '1px solid var(--hairline)' }}>
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="text-base sm:text-lg font-600 text-[var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
