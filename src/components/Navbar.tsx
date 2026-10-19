import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  Wallet as WalletIcon,
  Moon,
  Sun,
  Globe,
  Shield,
  User as UserIcon,
  LogOut,
  LogIn,
  Bell,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onNavigate, currentPage }) => {
  const { currentUser, userProfile, wallet, logOut, adminSession } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, formatBDT } = useThemeLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-slate-900/85 border-b border-gray-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            ৳
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-gray-900 via-emerald-800 to-indigo-900 dark:from-white dark:via-emerald-300 dark:to-indigo-200 bg-clip-text text-transparent">
              BDT Earn Pro
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 -mt-1">
              FINTECH REWARDS
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Admin Panel Direct Button */}
          <button
            onClick={() => onNavigate('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentPage === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
            {adminSession && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* User Wallet Balance or Login button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('wallet')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
              >
                <WalletIcon className="w-4 h-4 text-emerald-500" />
                <span>{formatBDT(wallet?.balance || 0)}</span>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow hover:ring-2 hover:ring-emerald-500 transition-all"
                >
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </button>

                {profileDropdownOpen && (
                  <div
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn"
                  >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                      <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {userProfile?.displayName || 'Member'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentUser.email}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span>Ref: {userProfile?.referralCode || 'N/A'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      {t('navProfile')}
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('wallet');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <WalletIcon className="w-4 h-4 text-emerald-500" />
                      {t('navWallet')}
                    </button>

                    <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

                    <button
                      onClick={async () => {
                        await logOut();
                        setProfileDropdownOpen(false);
                        onNavigate('landing');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navLogout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-emerald-600 transition-colors"
              >
                {t('navLogin')}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all"
              >
                {t('navRegister')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
