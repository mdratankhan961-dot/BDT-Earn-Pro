import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { LayoutDashboard, Clock, Sparkles, Video, Wallet } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { t } = useThemeLanguage();

  const navItems = [
    { id: 'dashboard', label: t('navHome'), icon: LayoutDashboard },
    { id: 'tasks', label: t('navTasks'), icon: Clock },
    { id: 'spin', label: t('navSpin'), icon: Sparkles },
    { id: 'ads', label: t('navAds'), icon: Video },
    { id: 'wallet', label: t('navWallet'), icon: Wallet },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 absolute -bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
