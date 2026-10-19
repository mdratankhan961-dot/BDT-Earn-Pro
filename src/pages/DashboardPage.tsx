import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import {
  Wallet as WalletIcon,
  TrendingUp,
  Clock,
  Sparkles,
  Users,
  Video,
  ArrowUpRight,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, wallet } = useAuth();
  const { t, formatBDT } = useThemeLanguage();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);

  const referralCode = userProfile?.referralCode || 'BDTPRO';
  const shareLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    showToast(t('codeCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleRecentTransactions = [
    {
      id: 'tx_seed_1',
      title: 'Daily Attendance Bonus',
      type: 'task_reward',
      amount: 3.0,
      time: 'Today, 10:25 AM',
    },
    {
      id: 'tx_seed_2',
      title: 'Lucky Wheel Spin Win',
      type: 'spin_reward',
      amount: 5.0,
      time: 'Today, 09:14 AM',
    },
    {
      id: 'tx_seed_3',
      title: 'Adsterra Video Reward',
      type: 'video_ad_reward',
      amount: 1.5,
      time: 'Yesterday, 08:40 PM',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t('accountActive')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {userProfile?.displayName || 'Earner'}! 👋
            </h1>
            <p className="text-sm text-emerald-100 max-w-lg">
              Start today's tasks and spin the lucky wheel to maximize your BDT daily earnings.
            </p>
          </div>

          {/* Quick Referral Box */}
          <div className="bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/10 sm:max-w-xs w-full space-y-2">
            <div className="text-xs text-emerald-200 font-medium">Your Referral Code</div>
            <div className="flex items-center justify-between gap-2 bg-black/30 px-3 py-2 rounded-xl">
              <span className="font-mono font-bold tracking-wider text-base text-amber-300">
                {referralCode}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-[11px] text-white/70">
              Earn ৳10 for each friend who signs up!
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {t('availableBalance')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {formatBDT(wallet?.balance || 0)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onNavigate('withdraw')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{t('navWithdraw')}</span>
            </button>
            <button
              onClick={() => onNavigate('wallet')}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 font-semibold"
            >
              {t('navWallet')}
            </button>
          </div>
        </div>

        {/* Total Earned */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {t('totalEarned')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {formatBDT(wallet?.totalEarned || 0)}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Lifetime task, ad, spin & refer revenue
          </div>
        </div>

        {/* Pending Withdrawal */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {t('pendingWithdrawal')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {formatBDT(wallet?.pendingWithdrawal || 0)}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Under admin verification
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {t('totalWithdrawn')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
            {formatBDT(wallet?.totalWithdrawn || 0)}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Paid to bKash / Nagad / Rocket
          </div>
        </div>
      </div>

      {/* Sub-Earnings Breakdown Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {t('dailyStats')}
          </h2>
          <span className="text-xs text-gray-400 font-medium">Categorized Earnings</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              {t('taskEarnings')}
            </div>
            <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {formatBDT(wallet?.taskEarnings || 0)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              {t('referralEarnings')}
            </div>
            <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {formatBDT(wallet?.referralEarnings || 0)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
              <Video className="w-3.5 h-3.5 text-blue-500" />
              {t('videoAdEarnings')}
            </div>
            <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {formatBDT(wallet?.videoAdEarnings || 0)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t('spinEarnings')}
            </div>
            <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {formatBDT(wallet?.spinEarnings || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('tasks')}
            className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-emerald-500/10 border border-emerald-500/20 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div className="mt-3 font-bold text-sm text-gray-900 dark:text-white">
              {t('navTasks')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Timed tasks with ৳ rewards
            </div>
          </button>

          <button
            onClick={() => onNavigate('spin')}
            className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 border border-amber-500/20 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="mt-3 font-bold text-sm text-gray-900 dark:text-white">
              {t('navSpin')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Win up to ৳100 daily
            </div>
          </button>

          <button
            onClick={() => onNavigate('ads')}
            className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 hover:from-indigo-500/20 hover:to-indigo-500/10 border border-indigo-500/20 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <div className="mt-3 font-bold text-sm text-gray-900 dark:text-white">
              {t('navAds')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Adsterra & Monetag ads
            </div>
          </button>

          <button
            onClick={() => onNavigate('refer')}
            className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10 border border-purple-500/20 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="mt-3 font-bold text-sm text-gray-900 dark:text-white">
              {t('navRefer')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Earn ৳10 per friend
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {t('recentTransactions')}
          </h2>
          <button
            onClick={() => onNavigate('wallet')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {t('viewAllTransactions')}
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {sampleRecentTransactions.map((tx) => (
            <div key={tx.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  +৳
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {tx.title}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{tx.time}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{formatBDT(tx.amount)}
                </div>
                <div className="text-[10px] text-gray-400 font-medium uppercase">Credit</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
