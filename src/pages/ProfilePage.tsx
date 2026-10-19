import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import {
  User,
  Mail,
  Shield,
  Key,
  Globe,
  Moon,
  Sun,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, logOut, sendVerificationEmail, sendPasswordReset } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = useThemeLanguage();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);

  const referralCode = userProfile?.referralCode || 'BDTPRO';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    showToast(t('codeCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await sendVerificationEmail();
      showToast(t('verificationEmailSent'), 'success');
    } catch (e: any) {
      showToast(e.message || 'Error sending link.', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordReset(currentUser.email);
      showToast('Password reset link sent to your email!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Error.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-emerald-500/20">
          {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {userProfile?.displayName || 'Member'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                userProfile?.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
              }`}
            >
              {userProfile?.status || 'active'}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            ID: {currentUser?.uid}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentUser?.email}
          </p>
        </div>

        <button
          onClick={logOut}
          className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('navLogout')}</span>
        </button>
      </div>

      {/* Account Details & Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Verification & Security */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Account Security</span>
          </h2>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Email Verification</span>
              {currentUser?.emailVerified ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <AlertCircle className="w-3.5 h-3.5" /> Unverified
                </span>
              )}
            </div>
            {!currentUser?.emailVerified && (
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {resending ? t('loading') : t('resendVerificationEmail')}
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">Password</div>
              <div className="text-[11px] text-gray-400">Request password reset link</div>
            </div>
            <button
              onClick={handleResetPassword}
              className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-xs font-bold hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span>App Preferences</span>
          </h2>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('language')}</div>
              <div className="text-[11px] text-gray-400">English or বাংলা</div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'bn'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('theme')}</div>
              <div className="text-[11px] text-gray-400">{theme === 'dark' ? t('darkMode') : t('lightMode')}</div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Support */}
      <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">Need Support or Help?</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Join our official community channel</div>
          </div>
        </div>

        <a
          href="https://t.me/bdtearnpro"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Telegram Community</span>
        </a>
      </div>
    </div>
  );
};
