import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  LayoutDashboard,
  Clock,
  Users,
  Video,
  Sparkles,
  Wallet,
  ArrowUpRight,
  User,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isAdmin }) => {
  const { t } = useThemeLanguage();

  const menuItems = [
    { id: 'dashboard', label: t('navHome'), icon: LayoutDashboard },
    { id: 'tasks', label: t('navTasks'), icon: Clock, badge: 'Hot' },
    { id: 'refer', label: t('navRefer'), icon: Users, badge: '৳10' },
    { id: 'ads', label: t('navAds'), icon: Video },
    { id: 'spin', label: t('navSpin'), icon: Sparkles, badge: 'Win' },
    { id: 'wallet', label: t('navWallet'), icon: Wallet },
    { id: 'withdraw', label: t('navWithdraw'), icon: ArrowUpRight },
    { id: 'profile', label: t('navProfile'), icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200/80 dark:border-slate-800 p-4 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Main Menu
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Admin Panel Quick Section */}
      <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-1">
        <button
          onClick={() => onNavigate('admin')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            currentPage === 'admin'
              ? 'bg-indigo-600 text-white'
              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
          }`}
        >
          <Shield className="w-5 h-5 text-indigo-500" />
          <span>{t('adminPortal')}</span>
        </button>

        {/* Telegram & Support link */}
        <a
          href="https://t.me/bdtearnpro"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Official Telegram Support</span>
        </a>
      </div>
    </aside>
  );
};
