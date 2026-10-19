import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from './Toast';
import { AlertCircle, CheckCircle2, Megaphone, X } from 'lucide-react';

interface NoticeBannerProps {
  noticeText?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ noticeText }) => {
  const { currentUser, sendVerificationEmail } = useAuth();
  const { t } = useThemeLanguage();
  const { showToast } = useToast();

  const [dismissed, setDismissed] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleResend = async () => {
    setSendingVerification(true);
    try {
      await sendVerificationEmail();
      showToast(t('verificationEmailSent'), 'success');
    } catch (e: any) {
      showToast(e.message || 'Error sending verification link.', 'error');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Email Verification Banner */}
      {currentUser && !currentUser.emailVerified && (
        <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t('emailVerificationBanner')}</span>
            </div>
            <button
              onClick={handleResend}
              disabled={sendingVerification}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all disabled:opacity-50"
            >
              {sendingVerification ? t('loading') : t('resendVerificationEmail')}
            </button>
          </div>
        </div>
      )}

      {/* Admin Notice Marquee / Banner */}
      {noticeText && !dismissed && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <Megaphone className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
              <span className="truncate">{noticeText}</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-white/80 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
