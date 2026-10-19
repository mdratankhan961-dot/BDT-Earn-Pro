import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import { SpinWheel } from '../components/SpinWheel';
import { SpinSegment } from '../types';
import {
  Sparkles,
  Trophy,
  History,
  Info,
  Award,
  Zap,
} from 'lucide-react';

export const SpinWinPage: React.FC = () => {
  const { currentUser, refreshWallet } = useAuth();
  const { t, formatBDT } = useThemeLanguage();
  const { showToast } = useToast();

  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [spinsRemaining, setSpinsRemaining] = useState(5);
  const [loading, setLoading] = useState(true);

  // Recent winners list
  const recentWinners = [
    { name: 'Habibur R.', amount: 50.0, time: '2 mins ago' },
    { name: 'Nusrat Jahan', amount: 25.0, time: '7 mins ago' },
    { name: 'Tanvir Hossain', amount: 100.0, time: '14 mins ago' },
    { name: 'Farhana Akter', amount: 10.0, time: '22 mins ago' },
  ];

  useEffect(() => {
    fetchSpinSettings();
  }, []);

  const fetchSpinSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.spinSettings && data.spinSettings.segments) {
        setSegments(data.spinSettings.segments);
        setSpinsRemaining(data.spinSettings.dailyLimit || 5);
      }
    } catch (e) {
      console.warn('Failed to load spin settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpinEnd = async (wonSegment: SpinSegment, balance: number) => {
    setSpinsRemaining((prev) => Math.max(0, prev - 1));
    showToast(`Congratulations! You won ${wonSegment.label}!`, 'success');
    await refreshWallet();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Lucky Fortune Wheel
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t('spinTitle')}</h1>
          <p className="text-xs sm:text-sm text-amber-100">{t('spinSubtitle')}</p>
        </div>
      </div>

      {/* Main Wheel Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          {currentUser ? (
            <SpinWheel
              segments={segments}
              onSpinEnd={handleSpinEnd}
              userId={currentUser.uid}
              spinsRemaining={spinsRemaining}
            />
          ) : (
            <div className="text-center py-12 space-y-3">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Login to Spin & Win
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Please log in with your email or Gmail to spin the lucky wheel and win instant BDT cash rewards.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Info & Winners */}
        <div className="space-y-5">
          {/* Recent Winners */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Live Lucky Winners</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              {recentWinners.map((winner, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {winner.name}
                    </div>
                    <div className="text-[10px] text-gray-400">{winner.time}</div>
                  </div>
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    +{formatBDT(winner.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fair Play Notice */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Fair Random Selection</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Every spin result is securely calculated by our server RNG according to transparent probability distributions. The client browser cannot manipulate or alter the outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
