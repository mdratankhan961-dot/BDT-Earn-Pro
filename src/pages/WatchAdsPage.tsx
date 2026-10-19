import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import { fireRewardConfetti } from '../lib/confetti';
import { AdCampaign } from '../types';
import {
  Video,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const WatchAdsPage: React.FC = () => {
  const { currentUser, refreshWallet } = useAuth();
  const { t, formatBDT } = useThemeLanguage();
  const { showToast } = useToast();

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Active watching ad modal/timer
  const [activeAd, setActiveAd] = useState<{
    campaign: AdCampaign;
    secondsLeft: number;
    isViewing: boolean;
  } | null>(null);

  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.adCampaigns) {
        setCampaigns(data.adCampaigns);
      }
    } catch (e) {
      console.warn('Failed to load campaigns:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWatch = (camp: AdCampaign) => {
    if (!currentUser) {
      showToast('Please login to watch ads and earn rewards.', 'error');
      return;
    }

    setActiveAd({
      campaign: camp,
      secondsLeft: 12, // 12 seconds preview duration
      isViewing: true,
    });
  };

  useEffect(() => {
    if (!activeAd || !activeAd.isViewing) return;

    const timer = setInterval(() => {
      setActiveAd((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) {
          clearInterval(timer);
          return { ...prev, secondsLeft: 0 };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAd?.isViewing]);

  const handleClaimReward = async () => {
    if (!activeAd || !currentUser) return;
    setClaiming(true);

    try {
      const res = await fetch('/api/ads/reward-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: activeAd.campaign.id,
          userId: currentUser.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to claim ad reward.', 'error');
        setClaiming(false);
        return;
      }

      fireRewardConfetti();
      showToast(t('adVerifySuccess'), 'success');
      await refreshWallet();
      setActiveAd(null);
    } catch (e: any) {
      showToast(e.message || 'Reward network error.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-700 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Video className="w-3.5 h-3.5" />
            Verified Video Ads
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t('adsTitle')}</h1>
          <p className="text-xs sm:text-sm text-indigo-100">{t('adsSubtitle')}</p>
        </div>
      </div>

      {/* Notice about Ad Providers */}
      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Provider Transparency Note:</span> Advertisements are powered by Adsterra and Monetag partner networks. All rewards are verified by the server backend to ensure strict anti-fraud compliance and legitimate impressions.
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                  {camp.provider} • {camp.format}
                </span>
                <span className="text-xs text-gray-400">Limit: {camp.dailyLimit}/day</span>
              </div>

              <h3 className="font-bold text-base text-gray-900 dark:text-white">{camp.title}</h3>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                View this sponsored partner ad for 12 seconds to earn instant BDT cash into your wallet.
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Reward</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatBDT(camp.rewardBdt)}
                </div>
              </div>

              <button
                onClick={() => handleStartWatch(camp)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('watchAd')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ad Watching Modal Overlay */}
      {activeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {activeAd.campaign.provider} Sponsored Campaign
              </span>
              <button
                onClick={() => setActiveAd(null)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Exit
              </button>
            </div>

            {/* Video preview simulation container */}
            <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center text-white p-6 shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none" />
              <Video className="w-12 h-12 text-indigo-400 mb-2" />
              <h4 className="font-bold text-sm">{activeAd.campaign.title}</h4>
              <p className="text-[11px] text-gray-300 mt-1 max-w-xs">
                Playing sponsor high-CPM creative...
              </p>

              {/* Countdown badge */}
              <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 border border-white/20 text-xs font-bold flex items-center gap-1.5 text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{activeAd.secondsLeft > 0 ? `${activeAd.secondsLeft}s remaining` : 'Complete!'}</span>
              </div>
            </div>

            {/* Claim button */}
            {activeAd.secondsLeft === 0 ? (
              <button
                onClick={handleClaimReward}
                disabled={claiming}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{claiming ? t('loading') : `Claim ${formatBDT(activeAd.campaign.rewardBdt)} Reward`}</span>
              </button>
            ) : (
              <div className="text-xs text-gray-400">
                Please wait for the sponsor timer to finish before claiming.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
