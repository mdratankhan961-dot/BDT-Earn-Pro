import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Users,
  Video,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const { t } = useThemeLanguage();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Trusted Task Earning Platform in Bangladesh (BDT ৳)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Earn Real{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent">
              BDT Cash Daily
            </span>{' '}
            with Simple Tasks
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Complete timed tasks, view sponsored high-CPM ads, spin the lucky fortune wheel, and withdraw your earnings directly to your personal{' '}
            <span className="font-bold text-pink-600 dark:text-pink-400">bKash</span>,{' '}
            <span className="font-bold text-orange-600 dark:text-orange-400">Nagad</span>, or{' '}
            <span className="font-bold text-purple-600 dark:text-purple-400">Rocket</span> account.
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              <span>Start Earning Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white font-bold text-base hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
            >
              Member Login
            </button>
          </div>

          {/* Payment Method Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span>Fast Payouts Via:</span>
            <span className="px-3 py-1 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900">
              bKash Personal
            </span>
            <span className="px-3 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900">
              Nagad Personal
            </span>
            <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
              Rocket Personal
            </span>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl">
          <div className="text-center p-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">৳380,000+</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">Paid to Members</div>
          </div>
          <div className="text-center p-3 border-l border-gray-100 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">18,500+</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">Active Earners</div>
          </div>
          <div className="text-center p-3 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-amber-500">120,000+</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">Tasks Completed</div>
          </div>
          <div className="text-center p-3 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">100%</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">Free Registration</div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Multiple Ways to Earn Daily
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Choose from timed tasks, video views, daily wheel spins, and generous referral commissions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Timed Tasks</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Complete admin-curated web visits, channel follows, and surveys with verified server-side countdowns.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Spin & Win</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Spin the interactive lucky wheel daily to win up to ৳100 instantly with fair backend probability.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Watch Video Ads</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              View sponsored Adsterra and Monetag campaigns with transparent view tracking and rewards.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-md hover:shadow-xl transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Refer & Earn</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Earn ৳10 instant commission for every friend who joins using your unique referral code.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Security Notice */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Zero Investment • 100% Secure • Official Verification</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            We never ask for user bank account PINs, OTPs, or passwords. All withdrawals are securely reviewed and verified through manual admin ledger processing.
          </p>
          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            Create Your Free Account
          </button>
        </div>
      </section>
    </div>
  );
};
