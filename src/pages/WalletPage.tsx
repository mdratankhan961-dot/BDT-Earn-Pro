import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { WalletTransaction } from '../types';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';

interface WalletPageProps {
  onNavigate: (page: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const { currentUser, wallet } = useAuth();
  const { t, formatBDT } = useThemeLanguage();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchWalletData();
    }
  }, [currentUser]);

  const fetchWalletData = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/wallet/${currentUser.uid}`);
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.warn('Wallet fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type.includes(filterType);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <WalletIcon className="w-3.5 h-3.5" />
              BDT Financial Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{t('walletTitle')}</h1>
            <p className="text-xs sm:text-sm text-emerald-100">{t('walletSubtitle')}</p>
          </div>

          <button
            onClick={() => onNavigate('withdraw')}
            className="px-6 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>{t('requestWithdrawal')}</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-500">{t('availableBalance')}</span>
          <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatBDT(wallet?.balance || 0)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Ready for withdrawal</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-500">{t('pendingWithdrawal')}</span>
          <div className="mt-2 text-3xl font-black text-amber-500">
            {formatBDT(wallet?.pendingWithdrawal || 0)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Held in payout queue</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-500">{t('totalEarned')}</span>
          <div className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {formatBDT(wallet?.totalEarned || 0)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Gross earnings</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-gray-500">{t('totalWithdrawn')}</span>
          <div className="mt-2 text-3xl font-black text-teal-600 dark:text-teal-400">
            {formatBDT(wallet?.totalWithdrawn || 0)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Total paid out</div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Wallet Ledger History
            </h2>
            <p className="text-xs text-gray-400">
              Immutable transaction records for all credits and debits
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['all', 'task', 'referral', 'video', 'spin', 'withdrawal'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filterType === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            {t('noTransactionsYet')}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      tx.amount >= 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : '-'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {tx.description}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{tx.type}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${
                      tx.amount >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.amount >= 0 ? `+${formatBDT(tx.amount)}` : `-${formatBDT(Math.abs(tx.amount))}`}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Bal: {formatBDT(tx.balanceAfter)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
