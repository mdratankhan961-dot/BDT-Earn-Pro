import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { TaskItem, WithdrawalRequest, AdCampaign, SpinSegment } from '../types';
import { apiFetch, authHeader } from '../lib/api';
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
  Copy,
  Coins,
  Sliders,
  Check,
  Eye,
  Gift,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { currentUser, userProfile, adminSession, adminLogin, adminLogout } = useAuth();
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
    'overview' | 'users' | 'tasks' | 'ads' | 'rewards' | 'withdrawals' | 'settings' | 'logs'
  >('overview');

  // Overview Data
  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<TaskItem[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);
  const [adCampaignsList, setAdCampaignsList] = useState<AdCampaign[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<any>(null);

  // Dynamic Ad Settings State
  const [adSettings, setAdSettings] = useState<{
    adsterraSmartLink: string;
    monetagDirectLink: string;
    defaultYoutubeUrl: string;
    activeProvider: 'adsterra' | 'monetag' | 'rotate';
    adCountdownSeconds: number;
  }>({
    adsterraSmartLink: 'https://www.highcpmgate.com/sample-smartlink',
    monetagDirectLink: 'https://monetag.com/direct-link-demo',
    defaultYoutubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    activeProvider: 'adsterra',
    adCountdownSeconds: 10,
  });

  // Dynamic Payout Settings State
  const [payoutSettings, setPayoutSettings] = useState<{
    defaultTaskRewardBdt: number;
    watchAndEarnRewardBdt: number;
    referralCommissionBdt: number;
    dailySpinLimit: number;
  }>({
    defaultTaskRewardBdt: 5.0,
    watchAndEarnRewardBdt: 1.5,
    referralCommissionBdt: 10.0,
    dailySpinLimit: 5,
  });

  // Spin Wheel Settings State
  const [spinSettingsData, setSpinSettingsData] = useState<{
    dailyLimit: number;
    isEnabled: boolean;
    segments: SpinSegment[];
  }>({
    dailyLimit: 5,
    isEnabled: true,
    segments: [
      { id: '1', label: '৳1.00', valueBdt: 1.0, probability: 35, color: '#3B82F6', textColor: '#ffffff' },
      { id: '2', label: '৳2.00', valueBdt: 2.0, probability: 25, color: '#10B981', textColor: '#ffffff' },
      { id: '3', label: '৳5.00', valueBdt: 5.0, probability: 20, color: '#F59E0B', textColor: '#ffffff' },
      { id: '4', label: '৳10.00', valueBdt: 10.0, probability: 10, color: '#8B5CF6', textColor: '#ffffff' },
      { id: '5', label: '৳25.00', valueBdt: 25.0, probability: 5, color: '#EC4899', textColor: '#ffffff' },
      { id: '6', label: '৳50.00', valueBdt: 50.0, probability: 3, color: '#EF4444', textColor: '#ffffff' },
      { id: '7', label: '৳100.00', valueBdt: 100.0, probability: 2, color: '#059669', textColor: '#ffffff' },
    ],
  });

  // User search & balance modal
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceAdjustModal, setBalanceAdjustModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userEmail: string;
    targetField: 'balance' | 'points' | 'taskEarnings' | 'videoAdEarnings' | 'referralEarnings' | 'spinEarnings';
    operation: 'add' | 'subtract' | 'set';
    amount: string;
    reason: string;
    currentBalance: number;
    currentPoints: number;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
    userEmail: '',
    targetField: 'balance',
    operation: 'add',
    amount: '',
    reason: '',
    currentBalance: 0,
    currentPoints: 0,
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
      adProvider: 'adsterra',
      adDirectUrl: '',
      youtubeUrl: '',
    },
  });

  // Withdrawal queue filter & action state
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'paid' | 'rejected'>('all');
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
      ...authHeader(adminSession.token),
      'Content-Type': 'application/json',
    };

    try {
      if (activeTab === 'overview') {
        const res = await apiFetch('/api/admin/overview', { headers });
        if (res.ok && res.data) setOverview(res.data);
      } else if (activeTab === 'users') {
        const res = await apiFetch('/api/admin/users', { headers });
        if (res.ok && res.data) {
          setUsersList(res.data.users || []);
        }
      } else if (activeTab === 'tasks') {
        const res = await apiFetch('/api/tasks');
        if (res.ok && res.data) {
          setTasksList(res.data.tasks || []);
        }
      } else if (activeTab === 'withdrawals') {
        const res = await apiFetch('/api/admin/withdrawals', { headers });
        if (res.ok && res.data) {
          setWithdrawalsList(res.data.withdrawals || []);
        }
      } else if (activeTab === 'ads' || activeTab === 'rewards' || activeTab === 'settings') {
        const res = await apiFetch('/api/settings');
        if (res.ok && res.data) {
          const d = res.data;
          if (d.adSettings) setAdSettings(d.adSettings);
          if (d.payoutSettings) setPayoutSettings(d.payoutSettings);
          if (d.spinSettings) setSpinSettingsData(d.spinSettings);
          if (d.appSettings) setSettingsData(d.appSettings);
          if (d.adCampaigns) setAdCampaignsList(d.adCampaigns);
        }
      } else if (activeTab === 'logs') {
        const res = await apiFetch('/api/admin/activity-logs', { headers });
        if (res.ok && res.data) {
          setActivityLogs(res.data.logs || []);
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

    const inputTrimmed = username.trim();
    const isEmailInput = inputTrimmed.includes('@');

    // 1. Try backend / Netlify Function API login
    try {
      const res = await apiFetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputTrimmed, password }),
      });

      if (res.ok && res.data) {
        adminLogin(res.data.token, res.data.username, res.data.role);
        showToast(`Welcome Administrator ${res.data.username}`, 'success');
        setPassword('');
        setLoginLoading(false);
        return;
      }

      // If explicit wrong password for a non-email username on live backend, show error
      if (!isEmailInput && res.status === 401) {
        setLoginError(res.error || 'Invalid credentials.');
        setLoginLoading(false);
        return;
      }
    } catch {
      // Continue to Firebase Auth verification
    }

    // 2. Direct Firebase Authentication verification
    try {
      const emailToAuth = isEmailInput ? inputTrimmed : 'mdratankhan961@gmail.com';
      const userCred = await signInWithEmailAndPassword(auth, emailToAuth, password);
      const fbUser = userCred.user;

      const isSuperAdminEmail = fbUser.email?.toLowerCase() === 'mdratankhan961@gmail.com';
      let hasAdminRole = isSuperAdminEmail;

      if (!hasAdminRole) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'admin' || data.role === 'super_admin') {
              hasAdminRole = true;
            }
          }
        } catch (docErr) {
          console.warn('Firestore role check:', docErr);
        }
      }

      if (!hasAdminRole) {
        setLoginError('Authentication succeeded, but this account is not registered as an administrator.');
        setLoginLoading(false);
        return;
      }

      const idToken = await fbUser.getIdToken();
      adminLogin(idToken, fbUser.displayName || 'Md Ratan', 'super_admin');
      showToast(`Welcome Administrator ${fbUser.displayName || 'Md Ratan'}`, 'success');
      setPassword('');
    } catch (fbErr: any) {
      if (
        fbErr.code === 'auth/invalid-credential' ||
        fbErr.code === 'auth/wrong-password' ||
        fbErr.code === 'auth/user-not-found' ||
        fbErr.code === 'auth/invalid-email'
      ) {
        setLoginError('Invalid username/email or password.');
      } else {
        setLoginError(fbErr.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Secondary login route for verified Firebase Admin users
  const handleFirebaseAdminLogin = async () => {
    if (!currentUser) {
      showToast('Please log into your Firebase account first.', 'error');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);

    const isAuthorizedEmail = currentUser.email?.toLowerCase() === 'mdratankhan961@gmail.com';
    const isAuthorizedRole = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

    // First try backend verification endpoint
    try {
      const res = await apiFetch('/api/auth/firebase-admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          uid: currentUser.uid,
          displayName: currentUser.displayName,
        }),
      });

      if (res.ok && res.data) {
        adminLogin(res.data.token, res.data.username, res.data.role);
        showToast(`Welcome Administrator ${res.data.username}`, 'success');
        setLoginLoading(false);
        return;
      }
    } catch {
      // Backend not available, check direct Firebase credentials
    }

    // Direct Firebase verification fallback
    if (isAuthorizedEmail || isAuthorizedRole) {
      try {
        const idToken = await currentUser.getIdToken();
        adminLogin(idToken, currentUser.displayName || 'Md Ratan', 'super_admin');
        showToast(`Welcome Administrator ${currentUser.displayName || 'Md Ratan'}`, 'success');
      } catch (e: any) {
        setLoginError('Unable to generate Firebase session token: ' + e.message);
      }
    } else {
      setLoginError('Access denied: Your Firebase account is not authorized as an administrator.');
    }
    setLoginLoading(false);
  };

  // Balance & Points Adjustment
  const handleBalanceAdjustSubmit = async () => {
    if (!adminSession || !balanceAdjustModal.amount || !balanceAdjustModal.reason.trim()) {
      showToast('Amount and adjustment reason are required.', 'error');
      return;
    }

    try {
      const res = await apiFetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: balanceAdjustModal.userId,
          targetField: balanceAdjustModal.targetField,
          operation: balanceAdjustModal.operation,
          amountBdt: parseFloat(balanceAdjustModal.amount),
          reason: balanceAdjustModal.reason.trim(),
        }),
      });

      if (!res.ok || !res.data) {
        showToast(res.error || 'Adjustment failed.', 'error');
        return;
      }

      showToast(`Adjusted ${balanceAdjustModal.targetField} to ${formatBDT(res.data.balance)}!`, 'success');
      setBalanceAdjustModal({
        isOpen: false,
        userId: '',
        userName: '',
        userEmail: '',
        targetField: 'balance',
        operation: 'add',
        amount: '',
        reason: '',
        currentBalance: 0,
        currentPoints: 0,
      });
      loadAllAdminData();
    } catch (e: any) {
      showToast(e.message || 'Error.', 'error');
    }
  };

  // User Status Update (Active / Suspended / Blocked)
  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'blocked') => {
    if (!adminSession) return;
    try {
      const res = await apiFetch('/api/admin/users/status', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        showToast(`User status set to ${newStatus.toUpperCase()}`, 'success');
        loadAllAdminData();
      } else {
        showToast(res.error || 'Failed to update user status.', 'error');
      }
    } catch (e: any) {
      showToast('Failed to update user status.', 'error');
    }
  };

  // Save Dynamic Ad Settings (Adsterra, Monetag, YouTube)
  const handleSaveAdSettings = async () => {
    if (!adminSession) return;
    try {
      const res = await apiFetch('/api/admin/ad-settings/save', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adSettings }),
      });
      if (res.ok) {
        showToast('Ad Settings saved successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to save ad settings.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error saving ad settings.', 'error');
    }
  };

  // Save Dynamic Payout Settings
  const handleSavePayoutSettings = async () => {
    if (!adminSession) return;
    try {
      const res = await apiFetch('/api/admin/payout-settings/save', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPayoutSettings: payoutSettings }),
      });
      if (res.ok) {
        showToast('Reward payout amounts updated successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to update payout settings.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error updating payout settings.', 'error');
    }
  };

  // Save Spin Wheel Settings
  const handleSaveSpinSettings = async () => {
    if (!adminSession) return;
    try {
      const res = await apiFetch('/api/admin/spin-settings/save', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newSpinSettings: spinSettingsData }),
      });
      if (res.ok) {
        showToast('Spin Wheel configuration saved!', 'success');
      } else {
        showToast(res.error || 'Failed to save spin settings.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error saving spin settings.', 'error');
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
      const res = await apiFetch('/api/admin/withdrawals/action', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawalId: selectedWd.withdrawal.id,
          action: selectedWd.action,
          transactionReference: selectedWd.trxRef.trim(),
          rejectReason: selectedWd.rejectReason.trim(),
        }),
      });

      if (!res.ok || !res.data) {
        showToast(res.error || 'Action failed.', 'error');
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
      const res = await apiFetch('/api/admin/tasks/save', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskModal.task),
      });

      if (!res.ok) {
        showToast(res.error || 'Failed to save task.', 'error');
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
      const res = await apiFetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: authHeader(adminSession.token),
      });
      if (res.ok) {
        showToast('Task deleted.', 'success');
        loadAllAdminData();
      } else {
        showToast(res.error || 'Error deleting task.', 'error');
      }
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
      const res = await apiFetch('/api/auth/admin-change-password', {
        method: 'POST',
        headers: {
          ...authHeader(adminSession.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: pwModal.currentPassword,
          newPassword: pwModal.newPassword,
        }),
      });

      if (!res.ok) {
        showToast(res.error || 'Password update failed.', 'error');
        return;
      }

      showToast('Password changed successfully!', 'success');
      setPwModal({ isOpen: false, currentPassword: '', newPassword: '' });
    } catch (e: any) {
      showToast(e.message || 'Error changing password.', 'error');
    }
  };

  // If not logged in as Admin, show Secure Admin Login
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Admin Username or Email
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('Md Ratan');
                    setPassword('Ratan789#%');
                  }}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Fill Default Admin
                </button>
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Md Ratan or admin email"
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
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Authentication Notice</span>
                </div>
                <div className="leading-relaxed">{loginError}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? 'Authenticating...' : 'Enter Admin Console'}</span>
            </button>
          </form>

          {/* Optional Firebase Admin Sign-in */}
          {currentUser && (
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
              <div className="text-[11px] text-gray-500 text-center mb-2">Or continue with verified Firebase account:</div>
              <button
                type="button"
                onClick={handleFirebaseAdminLogin}
                disabled={loginLoading}
                className="w-full py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Verify & Enter as {currentUser.email || 'Firebase Admin'}</span>
              </button>
            </div>
          )}

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

  // Filtered withdrawals
  const filteredWithdrawals = withdrawalsList.filter((w) => {
    if (withdrawalFilter === 'all') return true;
    return w.status === withdrawalFilter;
  });

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
          { id: 'ads', label: 'Ad Settings', icon: Video },
          { id: 'rewards', label: 'Payouts & Spin Wheel', icon: Gift },
          { id: 'withdrawals', label: 'Withdrawals Queue', icon: ArrowUpRight },
          { id: 'settings', label: 'App Settings', icon: Settings },
          { id: 'logs', label: 'Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
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

      {/* ================= TAB 1: OVERVIEW ================= */}
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

      {/* ================= TAB 2: USERS & BALANCES ================= */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                User Management & Balance Adjustments
              </h2>
              <p className="text-xs text-gray-400">
                View user profiles and manually adjust balances, points, task rewards, watch & earn, and referral bonuses.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-slate-800 uppercase font-bold text-[10px] text-gray-400">
                <tr>
                  <th className="p-3">User ID & Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Available Balance</th>
                  <th className="p-3">Total Earned</th>
                  <th className="p-3">Breakdown</th>
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
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                          <span>{u.id}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(u.id);
                              showToast('Copied User ID', 'info');
                            }}
                            className="hover:text-indigo-600"
                            title="Copy ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                        {u.email}
                      </td>
                      <td className="p-3">
                        <select
                          value={u.status || 'active'}
                          onChange={(e) => handleUpdateUserStatus(u.id, e.target.value as any)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border-none outline-none cursor-pointer ${
                            u.status === 'active' || !u.status
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : u.status === 'suspended'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatBDT(u.wallet?.balance || 0)}
                      </td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-white">
                        {formatBDT(u.wallet?.totalEarned || 0)}
                      </td>
                      <td className="p-3 text-[10px] space-y-0.5">
                        <div className="text-gray-500">Tasks: ৳{(u.wallet?.taskEarnings || 0).toFixed(1)}</div>
                        <div className="text-gray-500">Ads: ৳{(u.wallet?.videoAdEarnings || 0).toFixed(1)}</div>
                        <div className="text-gray-500">Refs: ৳{(u.wallet?.referralEarnings || 0).toFixed(1)}</div>
                        <div className="text-gray-500">Spins: ৳{(u.wallet?.spinEarnings || 0).toFixed(1)}</div>
                        <div className="text-indigo-600 font-bold">Points: {u.points || 0}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() =>
                            setBalanceAdjustModal({
                              isOpen: true,
                              userId: u.id,
                              userName: u.displayName,
                              userEmail: u.email,
                              targetField: 'balance',
                              operation: 'add',
                              amount: '',
                              reason: '',
                              currentBalance: u.wallet?.balance || 0,
                              currentPoints: u.points || 0,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-xs shadow-sm flex items-center gap-1 ml-auto"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: TASKS MANAGEMENT ================= */}
      {activeTab === 'tasks' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Task Management & Payout Control
              </h2>
              <p className="text-xs text-gray-400">
                Configure tasks, set custom reward payouts (in BDT/coins), assigned sponsor links, and YouTube videos.
              </p>
            </div>
            <button
              onClick={() =>
                setTaskModal({
                  isOpen: true,
                  task: {
                    title: '',
                    description: '',
                    instructions: '1. Watch the sponsor ad.\n2. Click "Watch Now" to watch the YouTube video.\n3. Click "Claim" to receive your reward.',
                    category: 'Video & Social',
                    rewardBdt: 5.0,
                    timerDurationSeconds: 30,
                    adRequired: true,
                    adCountdownSeconds: 10,
                    dailyLimit: 2,
                    status: 'active',
                    targetUrl: '',
                    adProvider: 'adsterra',
                    adDirectUrl: '',
                    youtubeUrl: '',
                  },
                })
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
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
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {t.category}
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-1">{t.title}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Payout Reward</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                      {formatBDT(t.rewardBdt)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-[11px] space-y-1 border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>⏱ Video Duration: <strong>{t.timerDurationSeconds}s</strong></span>
                    <span>📺 Sponsor Ad: <strong>{t.adRequired ? '10s (Required)' : 'None'}</strong></span>
                  </div>
                  <div className="text-gray-500 truncate font-mono">
                    Provider: <strong className="uppercase text-indigo-600">{t.adProvider || 'adsterra'}</strong>
                  </div>
                  {t.youtubeUrl && (
                    <div className="text-gray-500 truncate font-mono">
                      YouTube: <span className="text-gray-400">{t.youtubeUrl}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-200 dark:border-slate-700">
                  <span className="text-xs text-gray-400">
                    {t.currentCompletions || 0} completed
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTaskModal({ isOpen: true, task: t })}
                      className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit & Payout</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: AD SETTINGS ================= */}
      {activeTab === 'ads' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Dynamic Ad Settings (Adsterra & Monetag & YouTube)
            </h2>
            <p className="text-xs text-gray-400">
              Input, edit, and save global direct links for Adsterra Smart Links, Monetag Direct Links, and default YouTube Video Links.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Adsterra Smart Link */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300 block">
                Adsterra Smart Link URL
              </label>
              <input
                type="text"
                value={adSettings.adsterraSmartLink}
                onChange={(e) => setAdSettings({ ...adSettings, adsterraSmartLink: e.target.value })}
                placeholder="https://www.highcpmgate.com/your-smartlink"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-gray-400 block">
                Direct Smart Link triggered during Step 1 of task workflow when Adsterra is active.
              </span>
            </div>

            {/* Monetag Direct Link */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300 block">
                Monetag Direct Link URL
              </label>
              <input
                type="text"
                value={adSettings.monetagDirectLink}
                onChange={(e) => setAdSettings({ ...adSettings, monetagDirectLink: e.target.value })}
                placeholder="https://monetag.com/direct-link-your-id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-gray-400 block">
                Direct monetized link triggered when Monetag provider is selected.
              </span>
            </div>

            {/* Default YouTube Video Link */}
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300 block">
                Default YouTube Video Link URL
              </label>
              <input
                type="text"
                value={adSettings.defaultYoutubeUrl}
                onChange={(e) => setAdSettings({ ...adSettings, defaultYoutubeUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-gray-400 block">
                Default promotional YouTube video presented during Step 2 "Watch Now".
              </span>
            </div>

            {/* Ad Provider & Countdown */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Active Direct Ad Provider
                </label>
                <select
                  value={adSettings.activeProvider}
                  onChange={(e) => setAdSettings({ ...adSettings, activeProvider: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                >
                  <option value="adsterra">Adsterra Smart Link</option>
                  <option value="monetag">Monetag Direct Link</option>
                  <option value="rotate">Rotate (50% / 50% Split)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Ad Countdown (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={adSettings.adCountdownSeconds}
                  onChange={(e) =>
                    setAdSettings({ ...adSettings, adCountdownSeconds: parseInt(e.target.value, 10) || 10 })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveAdSettings}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Ad Settings</span>
            </button>
          </div>

          {/* Ad Campaigns List */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Watch & Earn Video Ad Campaigns
            </h3>
            <div className="space-y-3">
              {adCampaignsList.map((ad, idx) => (
                <div
                  key={ad.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                >
                  <div className="w-full sm:w-1/3">
                    <span className="font-bold text-gray-900 dark:text-white">{ad.title}</span>
                    <span className="block text-[10px] uppercase font-bold text-indigo-600 mt-0.5">
                      {ad.provider} • {ad.format}
                    </span>
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="text-[10px] text-gray-400 block">Target / Direct URL</label>
                    <input
                      type="text"
                      value={ad.targetUrl}
                      onChange={(e) => {
                        const updated = [...adCampaignsList];
                        updated[idx].targetUrl = e.target.value;
                        setAdCampaignsList(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <label className="text-[10px] text-gray-400 block">Reward (৳)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={ad.rewardBdt}
                      onChange={(e) => {
                        const updated = [...adCampaignsList];
                        updated[idx].rewardBdt = parseFloat(e.target.value) || 0;
                        setAdCampaignsList(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>

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
                showToast('Campaign placements saved!', 'success');
              }}
              className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-slate-800 hover:bg-black text-white text-xs font-bold"
            >
              Update Campaign Rewards
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 5: PAYOUTS & SPIN WHEEL ================= */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Section 1: Dynamic Reward Payouts */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Reward Payout Amounts Control
              </h2>
              <p className="text-xs text-gray-400">
                Update default payout amounts across Tasks, Watch & Earn, and Referral bonuses in BDT/coins.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300 block">
                  Default Task Reward (৳)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={payoutSettings.defaultTaskRewardBdt}
                  onChange={(e) =>
                    setPayoutSettings({
                      ...payoutSettings,
                      defaultTaskRewardBdt: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-emerald-600 dark:text-emerald-400"
                />
                <span className="text-[10px] text-gray-400">Applied to newly created tasks</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300 block">
                  Watch & Earn Reward (৳)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={payoutSettings.watchAndEarnRewardBdt}
                  onChange={(e) =>
                    setPayoutSettings({
                      ...payoutSettings,
                      watchAndEarnRewardBdt: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-[10px] text-gray-400">Per sponsored video watched</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300 block">
                  Referral Bonus (৳)
                </label>
                <input
                  type="number"
                  step="1"
                  value={payoutSettings.referralCommissionBdt}
                  onChange={(e) =>
                    setPayoutSettings({
                      ...payoutSettings,
                      referralCommissionBdt: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-amber-600 dark:text-amber-400"
                />
                <span className="text-[10px] text-gray-400">Credited per invited user</span>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300 block">
                  Daily Free Spins Limit
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={payoutSettings.dailySpinLimit}
                  onChange={(e) =>
                    setPayoutSettings({
                      ...payoutSettings,
                      dailySpinLimit: parseInt(e.target.value, 10) || 5,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-purple-600 dark:text-purple-400"
                />
                <span className="text-[10px] text-gray-400">Spins per user every 24h</span>
              </div>
            </div>

            <button
              onClick={handleSavePayoutSettings}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Payout Amounts</span>
            </button>
          </div>

          {/* Section 2: Spin & Win Wheel Customization */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Spin & Win Wheel Segments Configuration
                </h2>
                <p className="text-xs text-gray-400">
                  Customize the reward amounts, probabilities, and colors for each segment on the lucky wheel.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={spinSettingsData.isEnabled}
                    onChange={(e) =>
                      setSpinSettingsData({ ...spinSettingsData, isEnabled: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Wheel Active</span>
                </label>
                <button
                  onClick={() => {
                    const newId = `${Date.now()}`;
                    setSpinSettingsData({
                      ...spinSettingsData,
                      segments: [
                        ...spinSettingsData.segments,
                        {
                          id: newId,
                          label: '৳15.00',
                          valueBdt: 15.0,
                          probability: 10,
                          color: '#0ea5e9',
                          textColor: '#ffffff',
                        },
                      ],
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Segment</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {spinSettingsData.segments.map((seg, idx) => (
                <div
                  key={seg.id || idx}
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 flex flex-wrap items-center gap-3 text-xs"
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-sm" style={{ backgroundColor: seg.color }}>
                    {idx + 1}
                  </span>

                  <div className="w-24">
                    <label className="text-[10px] text-gray-400 block">Label</label>
                    <input
                      type="text"
                      value={seg.label}
                      onChange={(e) => {
                        const updated = [...spinSettingsData.segments];
                        updated[idx].label = e.target.value;
                        setSpinSettingsData({ ...spinSettingsData, segments: updated });
                      }}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-gray-400 block">Value (৳ BDT)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={seg.valueBdt}
                      onChange={(e) => {
                        const updated = [...spinSettingsData.segments];
                        updated[idx].valueBdt = parseFloat(e.target.value) || 0;
                        setSpinSettingsData({ ...spinSettingsData, segments: updated });
                      }}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs text-emerald-600"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-gray-400 block">Probability (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={seg.probability}
                      onChange={(e) => {
                        const updated = [...spinSettingsData.segments];
                        updated[idx].probability = parseFloat(e.target.value) || 0;
                        setSpinSettingsData({ ...spinSettingsData, segments: updated });
                      }}
                      className="w-full px-2 py-1 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] text-gray-400 block">Color</label>
                    <input
                      type="color"
                      value={seg.color}
                      onChange={(e) => {
                        const updated = [...spinSettingsData.segments];
                        updated[idx].color = e.target.value;
                        setSpinSettingsData({ ...spinSettingsData, segments: updated });
                      }}
                      className="w-full h-7 rounded cursor-pointer"
                    />
                  </div>

                  {spinSettingsData.segments.length > 2 && (
                    <button
                      onClick={() => {
                        const updated = spinSettingsData.segments.filter((_, i) => i !== idx);
                        setSpinSettingsData({ ...spinSettingsData, segments: updated });
                      }}
                      className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-auto"
                      title="Remove Segment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveSpinSettings}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Spin Wheel Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 6: WITHDRAWALS QUEUE ================= */}
      {activeTab === 'withdrawals' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Withdrawals Queue & Payout Management
              </h2>
              <p className="text-xs text-gray-400">
                Process payment requests for bKash, Nagad, and Rocket with TrxID tracking or refund upon rejection.
              </p>
            </div>
            <button
              onClick={loadAllAdminData}
              className="p-2 text-gray-400 hover:text-gray-600 self-start sm:self-auto"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: `All (${withdrawalsList.length})` },
              {
                id: 'pending',
                label: `Pending (${withdrawalsList.filter((w) => w.status === 'pending').length})`,
              },
              {
                id: 'paid',
                label: `Paid (${withdrawalsList.filter((w) => w.status === 'paid').length})`,
              },
              {
                id: 'rejected',
                label: `Rejected (${withdrawalsList.filter((w) => w.status === 'rejected').length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setWithdrawalFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  withdrawalFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
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
                  <th className="p-3">Requested At</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-white">{w.userName}</div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-0.5 ${
                          w.method === 'bKash'
                            ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300'
                            : w.method === 'Nagad'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                        }`}
                      >
                        {w.method}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        <span>{w.accountNumber}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(w.accountNumber);
                            showToast('Copied account number', 'info');
                          }}
                          className="text-gray-400 hover:text-indigo-600"
                          title="Copy Number"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-bold">৳{w.amountBdt.toFixed(2)}</td>
                    <td className="p-3 text-rose-500">-৳{w.feeBdt.toFixed(2)}</td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ৳{w.finalPayableBdt.toFixed(2)}
                    </td>
                    <td className="p-3 text-[11px] text-gray-400">
                      {new Date(w.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          w.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : w.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
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
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
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
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {w.status === 'paid' && (
                        <span className="text-[11px] font-mono text-gray-400 block">
                          Trx: {w.transactionReference}
                        </span>
                      )}
                      {w.status === 'rejected' && (
                        <span className="text-[11px] text-rose-500 font-semibold block">
                          Refunded: {w.adminNote}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 7: SETTINGS ================= */}
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
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow"
          >
            Save App Settings
          </button>
        </div>
      )}

      {/* ================= TAB 8: AUDIT LOGS ================= */}
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

      {/* ================= MODAL: MULTI-FIELD BALANCE ADJUSTMENT ================= */}
      {balanceAdjustModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Adjust User Account Balances & Points
            </h3>
            <p className="text-xs text-gray-400">
              User: <span className="font-bold text-gray-800 dark:text-gray-200">{balanceAdjustModal.userName}</span> ({balanceAdjustModal.userEmail})
            </p>

            <div className="space-y-3 text-xs">
              {/* Category selector */}
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Balance or Earnings Field</label>
                <select
                  value={balanceAdjustModal.targetField}
                  onChange={(e) =>
                    setBalanceAdjustModal({
                      ...balanceAdjustModal,
                      targetField: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="balance">Main Available Balance (৳ BDT)</option>
                  <option value="points">Points / Coins</option>
                  <option value="taskEarnings">Task Rewards Balance (৳ BDT)</option>
                  <option value="videoAdEarnings">Watch & Earn Rewards (৳ BDT)</option>
                  <option value="referralEarnings">Referral Bonus Commission (৳ BDT)</option>
                  <option value="spinEarnings">Spin & Win Rewards (৳ BDT)</option>
                </select>
              </div>

              {/* Operation selector */}
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Operation Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustModal({ ...balanceAdjustModal, operation: 'add' })}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      balanceAdjustModal.operation === 'add'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    + Add Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustModal({ ...balanceAdjustModal, operation: 'subtract' })}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      balanceAdjustModal.operation === 'subtract'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    - Deduct Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustModal({ ...balanceAdjustModal, operation: 'set' })}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      balanceAdjustModal.operation === 'set'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    = Set Exact Amount
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">
                  Amount {balanceAdjustModal.targetField === 'points' ? '(Points)' : '(৳ BDT)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 50"
                  value={balanceAdjustModal.amount}
                  onChange={(e) =>
                    setBalanceAdjustModal({ ...balanceAdjustModal, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              {/* Reason input */}
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">
                  Mandatory Reason for Audit Log
                </label>
                <input
                  type="text"
                  placeholder="e.g. Promotional task bonus, correction, or campaign reward"
                  value={balanceAdjustModal.reason}
                  onChange={(e) =>
                    setBalanceAdjustModal({ ...balanceAdjustModal, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() =>
                  setBalanceAdjustModal({
                    isOpen: false,
                    userId: '',
                    userName: '',
                    userEmail: '',
                    targetField: 'balance',
                    operation: 'add',
                    amount: '',
                    reason: '',
                    currentBalance: 0,
                    currentPoints: 0,
                  })
                }
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceAdjustSubmit}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: WITHDRAWAL ACTION ================= */}
      {selectedWd.isOpen && selectedWd.withdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base capitalize">
              {selectedWd.action === 'paid' ? 'Mark Withdrawal as Paid' : 'Reject Withdrawal Request'}
            </h3>
            <p className="text-xs text-gray-400">
              {selectedWd.withdrawal.method} • {selectedWd.withdrawal.accountNumber} • Payable: ৳
              {selectedWd.withdrawal.finalPayableBdt.toFixed(2)}
            </p>

            {selectedWd.action === 'paid' && (
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Bank / MFS Transaction Reference ID (TrxID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9J28DA10K or 7X991823"
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
                className={`px-5 py-2 rounded-xl font-bold text-xs text-white shadow ${
                  selectedWd.action === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {selectedWd.action === 'paid' ? 'Mark Paid' : 'Reject & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TASK CREATE/EDIT ================= */}
      {taskModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              {taskModal.task.id ? 'Edit Task & Reward Amount' : 'Create New Timer Task'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Task Title</label>
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
                <label className="text-gray-400 block mb-1 font-semibold">Short Description</label>
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
                <label className="text-gray-400 block mb-1 font-semibold">Instructions for User</label>
                <textarea
                  rows={2}
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
                  <label className="text-gray-400 block mb-1 font-semibold">Reward in BDT (৳)</label>
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
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-semibold">Video Duration (Seconds)</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-semibold">Direct Ad Provider</label>
                  <select
                    value={taskModal.task.adProvider || 'adsterra'}
                    onChange={(e) =>
                      setTaskModal({
                        ...taskModal,
                        task: { ...taskModal.task, adProvider: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="adsterra">Adsterra Smart Link</option>
                    <option value="monetag">Monetag Direct Link</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-semibold">Category</label>
                  <select
                    value={taskModal.task.category || 'Video & Social'}
                    onChange={(e) =>
                      setTaskModal({
                        ...taskModal,
                        task: { ...taskModal.task, category: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Video & Social">Video & Social</option>
                    <option value="Website Visit">Website Visit</option>
                    <option value="Survey">Survey</option>
                    <option value="Daily Bonus">Daily Bonus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-semibold">
                  Assigned YouTube Video URL (Optional override)
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={taskModal.task.youtubeUrl || ''}
                  onChange={(e) =>
                    setTaskModal({
                      ...taskModal,
                      task: { ...taskModal.task, youtubeUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-semibold">
                  Custom Direct Ad Link URL (Optional override)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to use global Smart Link / Direct Link"
                  value={taskModal.task.adDirectUrl || ''}
                  onChange={(e) =>
                    setTaskModal({
                      ...taskModal,
                      task: { ...taskModal.task, adDirectUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="adReq"
                  checked={taskModal.task.adRequired ?? true}
                  onChange={(e) =>
                    setTaskModal({
                      ...taskModal,
                      task: { ...taskModal.task, adRequired: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600"
                />
                <label htmlFor="adReq" className="text-gray-700 dark:text-gray-300 font-semibold">
                  Require 10-second sponsor ad session before YouTube video unlock
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
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PASSWORD CHANGE ================= */}
      {pwModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base">Change Administrator Password</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={pwModal.currentPassword}
                  onChange={(e) => setPwModal({ ...pwModal, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  value={pwModal.newPassword}
                  onChange={(e) => setPwModal({ ...pwModal, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
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
