import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import { WithdrawalMethod, WithdrawalRequest } from '../types';
import {
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export const WithdrawPage: React.FC = () => {
  const { currentUser, userProfile, wallet, refreshWallet } = useAuth();
  const { t, formatBDT } = useThemeLanguage();
  const { showToast } = useToast();

  const [method, setMethod] = useState<WithdrawalMethod>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amountBdt, setAmountBdt] = useState<string>('100');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);

  // Policy Settings (default)
  const minWithdrawal = 50;
  const maxWithdrawal = 5000;
  const feePercent = 1.5;

  const numAmount = parseFloat(amountBdt) || 0;
  const fee = Number(((numAmount * feePercent) / 100).toFixed(2));
  const finalPayable = Math.max(0, Number((numAmount - fee).toFixed(2)));

  useEffect(() => {
    if (currentUser) {
      fetchWithdrawalHistory();
    }
  }, [currentUser]);

  const fetchWithdrawalHistory = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/wallet/${currentUser.uid}`);
      const data = await res.json();
      if (data.withdrawals) {
        setHistory(data.withdrawals);
      }
    } catch (e) {
      console.warn('Withdrawal history fetch notice:', e);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please login to request withdrawals.', 'error');
      return;
    }

    if (!userProfile?.emailVerified && !currentUser.emailVerified) {
      showToast('Please verify your email before requesting withdrawals.', 'error');
      return;
    }

    if (!accountNumber || !/^01[3-9]\d{8}$/.test(accountNumber.trim())) {
      showToast('Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).', 'error');
      return;
    }

    if (numAmount < minWithdrawal) {
      showToast(`Minimum withdrawal amount is ৳${minWithdrawal}.`, 'error');
      return;
    }

    if (numAmount > maxWithdrawal) {
      showToast(`Maximum withdrawal amount is ৳${maxWithdrawal}.`, 'error');
      return;
    }

    if ((wallet?.balance || 0) < numAmount) {
      showToast(`Insufficient available balance. You have ৳${wallet?.balance.toFixed(2)}.`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: userProfile?.displayName || 'Member',
          method,
          accountNumber: accountNumber.trim(),
          amountBdt: numAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Withdrawal request failed.', 'error');
        setSubmitting(false);
        return;
      }

      showToast(t('withdrawalSuccess'), 'success');
      await refreshWallet();
      await fetchWithdrawalHistory();
      setAccountNumber('');
      setAmountBdt('100');
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-700 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <ArrowUpRight className="w-3.5 h-3.5" />
            BDT Payout Request
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t('requestWithdrawal')}</h1>
          <p className="text-xs sm:text-sm text-pink-100">
            Withdraw your earned balance to your personal mobile banking account in Bangladesh.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
          {/* Balance Preview */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">{t('availableBalance')}</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatBDT(wallet?.balance || 0)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium">{t('pendingWithdrawal')}</div>
              <div className="text-lg font-bold text-amber-500">
                {formatBDT(wallet?.pendingWithdrawal || 0)}
              </div>
            </div>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-5">
            {/* Method Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                {t('withdrawalMethod')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setMethod('bKash')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'bKash'
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-md shadow-pink-500/10'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-xs">
                    bK
                  </span>
                  <span className="text-sm font-bold">bKash</span>
                  <span className="text-[10px] text-gray-400">Personal</span>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setMethod('Nagad')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'Nagad'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold shadow-md shadow-orange-500/10'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                    NG
                  </span>
                  <span className="text-sm font-bold">Nagad</span>
                  <span className="text-[10px] text-gray-400">Personal</span>
                </button>

                {/* Rocket */}
                <button
                  type="button"
                  onClick={() => setMethod('Rocket')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'Rocket'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold shadow-md shadow-purple-500/10'
                      : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                    RK
                  </span>
                  <span className="text-sm font-bold">Rocket</span>
                  <span className="text-[10px] text-gray-400">Personal</span>
                </button>
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                {method} {t('accountNumberLabel')}
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono tracking-wider text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Must be an active 11-digit personal account in Bangladesh.
              </span>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('amountLabel')}
                </label>
                <div className="flex gap-1.5 text-xs">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountBdt(String(amt))}
                      className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 text-[11px] font-semibold"
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                required
                min={minWithdrawal}
                max={maxWithdrawal}
                value={amountBdt}
                onChange={(e) => setAmountBdt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                <span>Min: ৳{minWithdrawal}</span>
                <span>Max: ৳{maxWithdrawal}</span>
              </div>
            </div>

            {/* Payout Calculation Breakdown */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-gray-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span>Requested Amount:</span>
                <span className="font-bold">৳{numAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span>Processing Fee ({feePercent}%):</span>
                <span className="text-rose-500 font-semibold">-৳{fee.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-sm font-black text-gray-900 dark:text-white">
                <span>{t('finalReceivable')}:</span>
                <span className="text-emerald-600 dark:text-emerald-400">৳{finalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>{t('securityNote')}</div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{submitting ? t('loading') : t('submitWithdrawal')}</span>
            </button>
          </form>
        </div>

        {/* Withdrawal Requests History */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              {t('withdrawalHistory')}
            </h3>
            <span className="text-xs text-gray-400">{history.length} Requests</span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              {t('noWithdrawalsYet')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
              {history.map((req) => (
                <div key={req.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                      {req.method} ({req.accountNumber})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        req.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : req.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          : req.status === 'approved'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-black text-gray-900 dark:text-white">
                      ৳{req.amountBdt.toFixed(2)}
                    </span>
                  </div>

                  {req.transactionReference && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded-lg">
                      TrxID: {req.transactionReference}
                    </div>
                  )}

                  {req.adminNote && req.status === 'rejected' && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded-lg">
                      Reason: {req.adminNote} (৳{req.amountBdt} refunded)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
