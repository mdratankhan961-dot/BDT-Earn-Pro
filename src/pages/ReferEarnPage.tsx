import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  DollarSign,
  Award,
  Send,
  MessageCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const ReferEarnPage: React.FC = () => {
  const { currentUser, userProfile, wallet } = useAuth();
  const { t, formatBDT } = useThemeLanguage();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    totalInvited: number;
    eligible: number;
    commissionBdt: number;
    history: any[];
  }>({
    totalInvited: 0,
    eligible: 0,
    commissionBdt: 10,
    history: [],
  });

  const referralCode = userProfile?.referralCode || 'BDTPRO';
  const shareLink = `${window.location.origin}?ref=${referralCode}`;

  useEffect(() => {
    if (currentUser) {
      fetchReferralStats();
    }
  }, [currentUser]);

  const fetchReferralStats = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/referrals/stats/${referralCode}`);
      const data = await res.json();
      setStats({
        totalInvited: data.totalInvited || 0,
        eligible: data.eligible || 0,
        commissionBdt: data.commissionBdt || 10,
        history: data.history || [],
      });
    } catch (e) {
      console.warn('Referrals fetch error:', e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    showToast(t('codeCopied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Join BDT Earn Pro and earn real BDT daily with simple tasks and wheel spins! Use my referral code: ${referralCode}\n${shareLink}`;

  const handleWhatsAppShare = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTelegramShare = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Gift className="w-3.5 h-3.5" />
            BDT Referral Program
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t('referTitle')}</h1>
          <p className="text-xs sm:text-sm text-purple-100">{t('referSubtitle')}</p>
        </div>
      </div>

      {/* Referral Code & Share Link Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {t('yourReferralCode')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Code box */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-gray-400 font-medium">Referral Code</div>
              <div className="text-2xl font-black font-mono tracking-widest text-emerald-600 dark:text-emerald-400 mt-0.5">
                {referralCode}
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : t('copyCode')}</span>
            </button>
          </div>

          {/* Share shortcuts */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-gray-400 font-medium">Direct Share</div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                Invite friends via social apps
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow transition-all"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleTelegramShare}
                className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow transition-all"
                title="Share on Telegram"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-all"
                title="Copy share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('totalReferrals')}</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 dark:text-white">
            {stats.totalInvited} Members
          </div>
          <div className="text-xs text-gray-400 mt-1">Registered with your code</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('eligibleReferrals')}</span>
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.eligible} Qualified
          </div>
          <div className="text-xs text-gray-400 mt-1">Met qualifying active requirements</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">{t('referralEarnings')}</span>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatBDT(wallet?.referralEarnings || 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Total commission earned</div>
        </div>
      </div>

      {/* Rules & Policy */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Referral Program Transparency & Anti-Fraud Rules</span>
        </div>
        <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 list-disc pl-5">
          <li>Earn ৳{stats.commissionBdt.toFixed(2)} instant commission for each new member.</li>
          <li>Self-referrals, clone accounts, and duplicate IP registrations are strictly blocked.</li>
          <li>Commissions are calculated authoritatively on the server ledger.</li>
        </ul>
      </div>
    </div>
  );
};
