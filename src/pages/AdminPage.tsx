import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import { TaskItem, WithdrawalRequest, AdCampaign } from '../types';
import {
  Shield,
  LayoutDashboard,
  Users,
  Clock,
  ArrowUpRight,
  Sparkles,
  Video,
  Settings,
  FileText,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Key,
  LogOut,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { adminSession, adminLogin, adminLogout } = useAuth();
  const { formatBDT } = useThemeLanguage();
  const { showToast } = useToast();

  // Admin Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'tasks' | 'withdrawals' | 'rewards' | 'ads' | 'settings' | 'logs'
  >('overview');

  // Overview Data
  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<TaskItem[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);
  const [adCampaignsList, setAdCampaignsList] = useState<AdCampaign[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<any>(null);

  // User search & balance modal
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceAdjustModal, setBalanceAdjustModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    amount: string;
    reason: string;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    amount: '',
    reason: '',
  });

  // Task Create/Edit Modal
  const [taskModal, setTaskModal] = useState<{
    isOpen: boolean;
    task: Partial<TaskItem>;
  }>({
    isOpen: false,
    task: {
      title: '',
      description: '',
      instructions: '',
      category: 'Video & Social',
      rewardBdt: 5.0,
      timerDurationSeconds: 30,
      adRequired: true,
      adCountdownSeconds: 10,
      dailyLimit: 2,
      status: 'active',
      targetUrl: '',
    },
  });

  // Withdrawal action state
  const [selectedWd, setSelectedWd] = useState<{
    isOpen: boolean;
    withdrawal: WithdrawalRequest | null;
    action: 'approve' | 'paid' | 'reject';
    trxRef: string;
    rejectReason: string;
  }>({
    isOpen: false,
    withdrawal: null,
    action: 'approve',
    trxRef: '',
    rejectReason: '',
  });

  // Password change modal
  const [pwModal, setPwModal] = useState({
    isOpen: false,
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    if (adminSession) {
      loadAllAdminData();
    }
  }, [adminSession, activeTab]);

  const loadAllAdminData = async () => {
    if (!adminSession) return;
    const headers = {
      Authorization: `Bearer ${adminSession.token}`,
      'Content-Type': 'application/json',
    };

    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/overview', { headers });
        if (res.ok) setOverview(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', { headers });
        if (res.ok) {
          const d = await res.json();
          setUsersList(d.users || []);
        }
      } else if (activeTab === 'tasks') {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const d = await res.json();
          setTasksList(d.tasks || []);
        }
      } else if (activeTab === 'withdrawals') {
        const res = await fetch('/api/admin/withdrawals', { headers });
        if (res.ok) {
          const d = await res.json();
          setWithdrawalsList(d.withdrawals || []);
        }
      } else if (activeTab === 'ads') {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const d = await res.json();
          setAdCampaignsList(d.adCampaigns || []);
        }
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const d = await res.json();
          setSettingsData(d.appSettings);
        }
      } else if (activeTab === 'logs') {
        const res = await fetch('/api/admin/activity-logs', { headers });
        if (res.ok) {
          const d = await res.json();
          setActivityLogs(d.logs || []);
        }
      }
    } catch (e) {
      console.warn('Admin fetch error:', e);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Admin authentication failed.');
        setLoginLoading(false);
        return;
      }

      adminLogin(data.token, data.username, data.role);
      showToast(`Welcome Administrator ${data.username}`, 'success');
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Server connection error.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Balance Adjustment
  const handleBalanceAdjustSubmit = async () => {
    if (!adminSession || !balanceAdjustModal.amount || !balanceAdjustModal.reason.trim()) {
      showToast('Amount and adjustment reason are required.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: balanceAdjustModal.userId,
          amountBdt: parseFloat(balanceAdjustModal.amount),
          reason: balanceAdjustModal.reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Adjustment failed.', 'error');
        return;
      }

      showToast(`Adjusted user balance to ${formatBDT(data.balance)}`, 'success');
      setBalanceAdjustModal({ isOpen: false, userId: '', userName: '', amount: '', reason: '' });
      loadAllAdminData();
    } catch (e: any) {
      showToast(e.message || 'Error.', 'error');
    }
  };

  // Withdrawal Action Submit
  const handleWdActionSubmit = async () => {
    if (!adminSession || !selectedWd.withdrawal) return;

    if (selectedWd.action === 'paid' && !selectedWd.trxRef.trim()) {
      showToast('Transaction Reference / TrxID is required.', 'error');
      return;
    }
    if (selectedWd.action === 'reject' && !selectedWd.rejectReason.trim()) {
      showToast('Please state a reason for rejection.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/withdrawals/action', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawalId: selectedWd.withdrawal.id,
          action: selectedWd.action,
          transactionReference: selectedWd.trxRef.trim(),
          rejectReason: selectedWd.rejectReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Action failed.', 'error');
        return;
      }

      showToast(`Withdrawal marked as ${selectedWd.action}!`, 'success');
      setSelectedWd({ isOpen: false, withdrawal: null, action: 'approve', trxRef: '', rejectReason: '' });
      loadAllAdminData();
    } catch (e: any) {
      showToast(e.message || 'Action failed.', 'error');
    }
  };

  // Task Save
  const handleSaveTask = async () => {
    if (!adminSession || !taskModal.task.title || !taskModal.task.rewardBdt) {
      showToast('Title and reward amount are required.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/tasks/save', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskModal.task),
      });

      if (!res.ok) {
        showToast('Failed to save task.', 'error');
        return;
      }

      showToast('Task saved successfully!', 'success');
      setTaskModal({ isOpen: false, task: {} });
      loadAllAdminData();
    } catch (e: any) {
      showToast(e.message || 'Error saving task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!adminSession || !confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminSession.token}` },
      });
      showToast('Task deleted.', 'success');
      loadAllAdminData();
    } catch (e) {
      showToast('Error deleting task.', 'error');
    }
  };

  // Password Change
  const handleChangePassword = async () => {
    if (!adminSession || pwModal.newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth/admin-change-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminSession.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: pwModal.currentPassword,
          newPassword: pwModal.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Password update failed.', 'error');
        return;
      }

      showToast('Admin password changed successfully!', 'success');
      setPwModal({ isOpen: false, currentPassword: '', newPassword: '' });
    } catch (e: any) {
      showToast(e.message || 'Error.', 'error');
    }
  };

  // If Not Authenticated: Show Secure Admin Login Form
  if (!adminSession) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Secure Admin Control Center
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Authorized personnel only. All access is logged and rate-limited.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? 'Authenticating...' : 'Enter Admin Console'}</span>
            </button>
          </form>

          {/* Admin Credential Recovery Modal */}
          {showRecoveryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-4 shadow-2xl text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Admin Credential Recovery</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed text-left">
                  For platform and financial security, administrative passwords cannot be reset through public unauthenticated endpoints.
                </p>
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 text-left text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                  <div className="font-bold text-gray-800 dark:text-gray-200">Reset Procedures:</div>
                  <div>1. Update the <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">ADMIN_INITIAL_PASSWORD</code> environment variable in your server configuration.</div>
                  <div>2. If you are a team member, request an access reset from the root system administrator or via <span className="font-semibold text-indigo-600 dark:text-indigo-400">support@bdtearnpro.com</span>.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard Layout
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Admin Top Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black">BDT Earn Pro Administration</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                {adminSession.role}
              </span>
            </div>
            <div className="text-xs text-gray-400">Logged in as: {adminSession.username}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPwModal({ isOpen: true, currentPassword: '', newPassword: '' })}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Password</span>
          </button>
          <button
            onClick={adminLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'users', label: 'Users & Balances', icon: Users },
          { id: 'tasks', label: 'Task Management', icon: Clock },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
          { id: 'ads', label: 'Advertisements', icon: Video },
          { id: 'settings', label: 'App Settings', icon: Settings },
          { id: 'logs', label: 'Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-gray-500 font-bold">Total Members</span>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
                {overview.kpis.totalUsers}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-gray-500 font-bold">Pending Payouts</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
                {overview.kpis.pendingWithdrawalsCount}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-gray-500 font-bold">Total Rewards Credited</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBDT(overview.kpis.totalRewardsCredited)}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-gray-500 font-bold">Total Paid Out</span>
              <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">
                {formatBDT(overview.kpis.paidWithdrawalsTotal)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & BALANCES */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              User Accounts & Wallet Adjustments
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-slate-800 uppercase font-bold text-[10px] text-gray-400">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Available Balance</th>
                  <th className="p-3">Pending</th>
                  <th className="p-3">Total Earned</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {usersList
                  .filter(
                    (u) =>
                      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.id?.includes(searchQuery)
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3">
                        <div className="font-bold text-gray-900 dark:text-white">{u.displayName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(u.wallet?.balance || 0)}
                      </td>
                      <td className="p-3 font-semibold text-amber-500">
                        {formatBDT(u.wallet?.pendingWithdrawal || 0)}
                      </td>
                      <td className="p-3 font-semibold">{formatBDT(u.wallet?.totalEarned || 0)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() =>
                            setBalanceAdjustModal({
                              isOpen: true,
                              userId: u.id,
                              userName: u.displayName,
                              amount: '',
                              reason: '',
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-xs"
                        >
                          Adjust ৳
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TASKS MANAGEMENT */}
      {activeTab === 'tasks' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Admin Curated Timer Tasks
            </h2>
            <button
              onClick={() =>
                setTaskModal({
                  isOpen: true,
                  task: {
                    title: '',
                    description: '',
                    instructions: '',
                    category: 'Video & Social',
                    rewardBdt: 5.0,
                    timerDurationSeconds: 30,
                    adRequired: true,
                    adCountdownSeconds: 10,
                    dailyLimit: 2,
                    status: 'active',
                    targetUrl: '',
                  },
                })
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasksList.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{t.title}</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatBDT(t.rewardBdt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>⏱ {t.timerDurationSeconds}s timer</span>
                  <span>📺 10s ad: {t.adRequired ? 'Yes' : 'No'}</span>
                  <span>Completions: {t.currentCompletions || 0}</span>
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => setTaskModal({ isOpen: true, task: t })}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1.5 text-rose-600 hover:text-rose-800"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WITHDRAWAL REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              bKash / Nagad / Rocket Payout Queue
            </h2>
            <button
              onClick={loadAllAdminData}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-slate-800 uppercase font-bold text-[10px] text-gray-400">
                <tr>
                  <th className="p-3">User & Method</th>
                  <th className="p-3">Account Number</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Final Payable</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {withdrawalsList.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-white">{w.userName}</div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {w.method}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {w.accountNumber}
                    </td>
                    <td className="p-3 font-bold">৳{w.amountBdt.toFixed(2)}</td>
                    <td className="p-3 text-rose-500">-৳{w.feeBdt.toFixed(2)}</td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                      ৳{w.finalPayableBdt.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          w.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : w.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {w.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setSelectedWd({
                                isOpen: true,
                                withdrawal: w,
                                action: 'paid',
                                trxRef: '',
                                rejectReason: '',
                              })
                            }
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-xs"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() =>
                              setSelectedWd({
                                isOpen: true,
                                withdrawal: w,
                                action: 'reject',
                                trxRef: '',
                                rejectReason: '',
                              })
                            }
                            className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {w.status === 'paid' && (
                        <span className="text-[11px] font-mono text-gray-400">
                          Trx: {w.transactionReference}
                        </span>
                      )}
                      {w.status === 'rejected' && (
                        <span className="text-[11px] text-rose-500">Refunded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ADVERTISEMENTS */}
      {activeTab === 'ads' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Advertising Placements (Adsterra & Monetag)
          </h2>

          <div className="space-y-4">
            {adCampaignsList.map((ad, idx) => (
              <div
                key={ad.id}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{ad.title}</span>
                  <span className="text-xs font-semibold uppercase text-indigo-600">{ad.provider}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1">Target / Direct Link URL</label>
                    <input
                      type="text"
                      value={ad.targetUrl}
                      onChange={(e) => {
                        const updated = [...adCampaignsList];
                        updated[idx].targetUrl = e.target.value;
                        setAdCampaignsList(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Reward in BDT (৳)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={ad.rewardBdt}
                      onChange={(e) => {
                        const updated = [...adCampaignsList];
                        updated[idx].rewardBdt = parseFloat(e.target.value) || 0;
                        setAdCampaignsList(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={async () => {
                if (!adminSession) return;
                await fetch('/api/admin/ads/save', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${adminSession.token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ campaigns: adCampaignsList }),
                });
                showToast('Advertising settings saved!', 'success');
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow"
            >
              Save Advertising Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && settingsData && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Application Brand & Payout Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Application Name</label>
              <input
                type="text"
                value={settingsData.appName}
                onChange={(e) => setSettingsData({ ...settingsData, appName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settingsData.currencySymbol}
                onChange={(e) => setSettingsData({ ...settingsData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Minimum Withdrawal (৳)</label>
              <input
                type="number"
                value={settingsData.minWithdrawalBdt}
                onChange={(e) =>
                  setSettingsData({ ...settingsData, minWithdrawalBdt: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Withdrawal Fee (%)</label>
              <input
                type="number"
                step="0.1"
                value={settingsData.withdrawalFeePercent}
                onChange={(e) =>
                  setSettingsData({
                    ...settingsData,
                    withdrawalFeePercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-1">Global Announcement Notice</label>
              <textarea
                rows={2}
                value={settingsData.noticeText}
                onChange={(e) => setSettingsData({ ...settingsData, noticeText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <button
            onClick={async () => {
              if (!adminSession) return;
              await fetch('/api/admin/settings/save', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${adminSession.token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newSettings: settingsData }),
              });
              showToast('Settings updated!', 'success');
            }}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            Save App Settings
          </button>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Administrative Audit Activity Logs
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {log.action} <span className="font-normal text-gray-400">by {log.adminUsername}</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 mt-0.5">{log.details}</div>
                </div>
                <div className="text-right text-[11px] text-gray-400">
                  <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                  <div className="font-mono text-[10px]">{log.ip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Balance Adjustment */}
      {balanceAdjustModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base">Adjust User Balance</h3>
            <p className="text-xs text-gray-400">Target User: {balanceAdjustModal.userName}</p>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Adjustment Amount (৳) — Use negative for deduction
              </label>
              <input
                type="number"
                step="1"
                placeholder="+50 or -20"
                value={balanceAdjustModal.amount}
                onChange={(e) =>
                  setBalanceAdjustModal({ ...balanceAdjustModal, amount: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Mandatory Reason for Audit Log
              </label>
              <input
                type="text"
                placeholder="e.g. Promotional bonus or correction"
                value={balanceAdjustModal.reason}
                onChange={(e) =>
                  setBalanceAdjustModal({ ...balanceAdjustModal, reason: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() =>
                  setBalanceAdjustModal({ isOpen: false, userId: '', userName: '', amount: '', reason: '' })
                }
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAdjustSubmit}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Withdrawal Action */}
      {selectedWd.isOpen && selectedWd.withdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base capitalize">
              {selectedWd.action} Withdrawal Request
            </h3>
            <p className="text-xs text-gray-400">
              {selectedWd.withdrawal.method} • {selectedWd.withdrawal.accountNumber} • Payable: ৳
              {selectedWd.withdrawal.finalPayableBdt}
            </p>

            {selectedWd.action === 'paid' && (
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Bank / Agent Transaction Reference ID (TrxID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9J28DA10K"
                  value={selectedWd.trxRef}
                  onChange={(e) => setSelectedWd({ ...selectedWd, trxRef: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono uppercase"
                />
              </div>
            )}

            {selectedWd.action === 'reject' && (
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Rejection Reason (Funds will be refunded automatically)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inactive account number or verification failure"
                  value={selectedWd.rejectReason}
                  onChange={(e) => setSelectedWd({ ...selectedWd, rejectReason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() =>
                  setSelectedWd({ isOpen: false, withdrawal: null, action: 'approve', trxRef: '', rejectReason: '' })
                }
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleWdActionSubmit}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Task Create/Edit */}
      {taskModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base">
              {taskModal.task.id ? 'Edit Task' : 'Create New Timer Task'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskModal.task.title || ''}
                  onChange={(e) =>
                    setTaskModal({ ...taskModal, task: { ...taskModal.task, title: e.target.value } })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={taskModal.task.description || ''}
                  onChange={(e) =>
                    setTaskModal({
                      ...taskModal,
                      task: { ...taskModal.task, description: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Instructions for User</label>
                <textarea
                  rows={3}
                  value={taskModal.task.instructions || ''}
                  onChange={(e) =>
                    setTaskModal({
                      ...taskModal,
                      task: { ...taskModal.task, instructions: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Reward in BDT (৳)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={taskModal.task.rewardBdt || 5}
                    onChange={(e) =>
                      setTaskModal({
                        ...taskModal,
                        task: { ...taskModal.task, rewardBdt: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={taskModal.task.timerDurationSeconds || 30}
                    onChange={(e) =>
                      setTaskModal({
                        ...taskModal,
                        task: {
                          ...taskModal.task,
                          timerDurationSeconds: parseInt(e.target.value, 10) || 30,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="adReq"
                  checked={taskModal.task.adRequired}
                  onChange={(e) =>
                    setTaskModal({
                      ...taskModal,
                      task: { ...taskModal.task, adRequired: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600"
                />
                <label htmlFor="adReq" className="text-gray-700 dark:text-gray-300 font-semibold">
                  Require 10-second sponsor ad session before unlock
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setTaskModal({ isOpen: false, task: {} })}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {pwModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base">Change Admin Password</h3>
            <div>
              <label className="text-xs font-semibold block mb-1">Current Password</label>
              <input
                type="password"
                value={pwModal.currentPassword}
                onChange={(e) => setPwModal({ ...pwModal, currentPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">New Password (min 8 chars)</label>
              <input
                type="password"
                value={pwModal.newPassword}
                onChange={(e) => setPwModal({ ...pwModal, newPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPwModal({ isOpen: false, currentPassword: '', newPassword: '' })}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
