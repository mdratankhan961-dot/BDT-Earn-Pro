import React, { useState, useEffect, useRef } from 'react';
import { Eye, ShieldAlert, CheckCircle, ExternalLink, X, AlertTriangle } from 'lucide-react';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  userId: string;
  sponsorUrl?: string;
  adCountdownSeconds?: number;
  onAdVerified: (taskStartedAt: number, durationSeconds: number) => void;
}

export const AdModal: React.FC<AdModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  userId,
  sponsorUrl = 'https://monetag.com',
  adCountdownSeconds = 10,
  onAdVerified,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(adCountdownSeconds);
  const [isFocused, setIsFocused] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(adCountdownSeconds);
      setIsFocused(true);
      setVerifying(false);
      setVerified(false);
      setErrorMsg(null);
    }
  }, [isOpen, adCountdownSeconds]);

  // Anti-cheat window focus / visibility listener
  useEffect(() => {
    if (!isOpen || verified) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsFocused(false);
      } else {
        setIsFocused(true);
      }
    };

    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOpen, verified]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || verified || !isFocused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleCompleteAd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isFocused, verified]);

  const handleCompleteAd = async () => {
    setVerifying(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tasks/validate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Ad verification failed.');
        setVerifying(false);
        return;
      }
      setVerified(true);
      setVerifying(false);
      setTimeout(() => {
        onAdVerified(data.taskStartedAt, data.durationSeconds);
      }, 1200);
    } catch (e: any) {
      setErrorMsg(e.message || 'Verification network issue.');
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Sponsor Verification Session
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Status Icon */}
          <div className="relative mb-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                verified
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 border-2 border-emerald-500'
                  : !isFocused
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 border-2 border-amber-500'
                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 border-2 border-indigo-500'
              }`}
            >
              {verified ? (
                <CheckCircle className="w-10 h-10 animate-bounce" />
              ) : !isFocused ? (
                <AlertTriangle className="w-10 h-10 animate-pulse" />
              ) : (
                <span className="text-3xl font-extrabold">{secondsLeft}s</span>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {verified
              ? 'Ad Verified! Unlocking Task...'
              : !isFocused
              ? 'Countdown Paused!'
              : 'Sponsored Advertisement Session'}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-sm">
            {!isFocused ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Window lost focus. Please keep this tab active to finish the countdown.
              </span>
            ) : verified ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Sponsor requirement satisfied. Loading task instructions now...
              </span>
            ) : (
              'This verified ad countdown supports the task reward system. Please view the preview for 10 seconds.'
            )}
          </p>

          {/* Ad Simulation Container / Monetag Direct Link Preview */}
          <div className="w-full mt-5 p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-left">
            <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Adsterra / Monetag Partner Network
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-200/50 dark:bg-indigo-900/50 text-[10px]">
                High CPM
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Discover Top Bangladesh E-Commerce & Financial Services
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              Instant cashbacks, secure transactions, and exclusive discounts for registered members.
            </p>
            {sponsorUrl && (
              <a
                href={sponsorUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Visit Sponsor Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full mt-5">
            <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  verified
                    ? 'bg-emerald-500'
                    : !isFocused
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                }`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, ((adCountdownSeconds - secondsLeft) / adCountdownSeconds) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1.5">
              <span>Security Check</span>
              <span>
                {adCountdownSeconds - secondsLeft} / {adCountdownSeconds}s
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-left w-full">
              {errorMsg}
            </div>
          )}

          {/* Cancel button */}
          <div className="mt-6 flex justify-end w-full">
            <button
              onClick={onClose}
              disabled={verifying}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              Cancel & Exit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
