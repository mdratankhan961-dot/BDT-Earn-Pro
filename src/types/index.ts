export type UserStatus = 'active' | 'suspended' | 'blocked';
export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  referralCode: string;
  referredBy?: string;
  status: UserStatus;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  pendingWithdrawal: number;
  totalEarned: number;
  totalWithdrawn: number;
  taskEarnings: number;
  referralEarnings: number;
  videoAdEarnings: number;
  spinEarnings: number;
  updatedAt: string;
}

export type TransactionType =
  | 'task_reward'
  | 'referral_commission'
  | 'video_ad_reward'
  | 'spin_reward'
  | 'withdrawal_hold'
  | 'withdrawal_refund'
  | 'admin_adjustment';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive or negative
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  rewardBdt: number;
  timerDurationSeconds: number;
  adRequired: boolean;
  adCountdownSeconds: number;
  dailyLimit: number;
  currentCompletions: number;
  status: 'active' | 'inactive';
  targetUrl?: string;
  youtubeUrl?: string;
  adProvider?: 'adsterra' | 'monetag';
  adDirectUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdSettings {
  adsterraSmartLink: string;
  monetagDirectLink: string;
  defaultYoutubeUrl: string;
  activeProvider: 'adsterra' | 'monetag' | 'rotate';
  adCountdownSeconds: number;
}

export interface PayoutSettings {
  defaultTaskRewardBdt: number;
  watchAndEarnRewardBdt: number;
  referralCommissionBdt: number;
  dailySpinLimit: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  role: UserRole;
  createdAt?: string;
  wallet: Wallet;
}

export interface TaskSession {
  id: string;
  taskId: string;
  userId: string;
  sessionToken?: string;
  adStartedAt?: string;
  adCompletedAt?: string;
  taskStartedAt?: string;
  taskCompletedAt?: string;
  status: 'ad_in_progress' | 'task_in_progress' | 'ready_to_submit' | 'completed' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt?: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle?: string;
  taskSessionId: string;
  userId: string;
  userEmail?: string;
  submissionNote?: string;
  proofUrl?: string;
  rewardBdt: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

export type WithdrawalMethod = 'bKash' | 'Nagad' | 'Rocket';
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: WithdrawalMethod;
  accountNumber: string;
  amountBdt: number;
  feeBdt: number;
  finalPayableBdt: number;
  status: WithdrawalStatus;
  adminNote?: string;
  transactionReference?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredEmail: string;
  commissionBdt: number;
  status: 'pending' | 'qualified' | 'paid';
  createdAt: string;
  qualifiedAt?: string;
}

export interface SpinSegment {
  id: string;
  label: string;
  valueBdt: number;
  probability: number; // percentage 0-100
  color: string;
  textColor?: string;
}

export interface SpinSettings {
  dailyLimit: number;
  isEnabled: boolean;
  segments: SpinSegment[];
}

export interface SpinHistoryItem {
  id: string;
  userId: string;
  wonAmountBdt: number;
  segmentLabel: string;
  createdAt: string;
}

export type AdFormat = 'rewarded_video' | 'banner' | 'social_bar' | 'popunder' | 'direct_link';

export interface AdCampaign {
  id: string;
  title: string;
  provider: 'adsterra' | 'monetag' | 'custom';
  format: AdFormat;
  rewardBdt: number;
  dailyLimit: number;
  targetUrl: string;
  scriptCode?: string;
  isEnabled: boolean;
  placementLocation?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdViewRecord {
  id: string;
  campaignId: string;
  userId: string;
  rewardBdt: number;
  viewedAt: string;
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
  currencySymbol: string;
  currencyCode: string;
  defaultLanguage: 'en' | 'bn';
  minWithdrawalBdt: number;
  maxWithdrawalBdt: number;
  withdrawalFeePercent: number;
  referralCommissionBdt: number;
  supportEmail: string;
  telegramChannel?: string;
  noticeText?: string;
  isMaintenance: boolean;
  updatedAt?: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'reward' | 'withdrawal' | 'alert';
  isRead: boolean;
  createdAt: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetId?: string;
  details: string;
  ip?: string;
  createdAt: string;
}

export interface AdminSession {
  token: string;
  username: string;
  role: string;
  expiresAt: string;
}
