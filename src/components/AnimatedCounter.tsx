import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2,
  decimals = 0,
  className = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function (easeOutExpo)
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(easedProgress * value);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{count.toFixed(decimals)}{suffix}
    </motion.span>
  );
}

interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon: React.ElementType;
  delay?: number;
}

export function StatCard({ value, suffix = '', prefix = '', label, icon: Icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: 'spring' }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
      className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-carmine-50 rounded-xl flex items-center justify-center group-hover:bg-carmine-600 transition-colors duration-300">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-carmine-600 group-hover:text-white transition-colors" />
        </div>
        <AnimatedCounter
          value={value}
          suffix={suffix}
          prefix={prefix}
          className="text-2xl sm:text-3xl md:text-4xl font-700 text-carmine-600"
        />
      </div>
      <p className="text-xs sm:text-sm text-gray-500 font-500 leading-tight">{label}</p>
    </motion.div>
  );
}
