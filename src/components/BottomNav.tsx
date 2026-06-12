import { motion } from 'framer-motion';
import { Home, Upload, BarChart3, User } from './icons';

interface BottomNavProps {
  currentRoute: string;
  onNavigate: (path: string) => void;
  session: any;
}

export default function BottomNav({ currentRoute, onNavigate, session }: BottomNavProps) {
  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/upload', icon: Upload, label: 'Загрузка' },
    { path: '/results', icon: BarChart3, label: 'Результаты' },
    ...(session ? [{ path: '/profile', icon: User, label: 'Профиль' }] : []),
  ];

  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-t border-[var(--border)] z-50 safe-area-bottom"
      >
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item, index) => {
            const isActive = currentRoute === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className="flex flex-col items-center justify-center p-2 min-w-[64px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-carmine-600 text-white' : 'text-[var(--text-tertiary)]'
                }`}>
                  <item.icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute inset-0 bg-carmine-600 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-500 mt-1 transition-colors ${
                  isActive ? 'text-carmine-600' : 'text-[var(--text-tertiary)]'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Spacer for bottom nav */}
      <div className="md:hidden h-20" />
    </>
  );
}
