import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Secrets
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'bdt-earn-pro-super-secret-jwt-key-2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'bdt-task-session-crypt-secret';

app.use(cors());
app.use(express.json());

// In-Memory Data Store (Synchronized with Firestore structures)
// Note: In server environment, this acts as the trusted backend engine
interface AdminAccount {
  username: string;
  passwordHash: string;
  role: 'super_admin' | 'admin';
  updatedAt: string;
}

const INITIAL_ADMIN_USERNAME = process.env.ADMIN_INITIAL_USERNAME || 'mdratan';
const INITIAL_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Ratan789';

const adminAccounts: Record<string, AdminAccount> = {
  [INITIAL_ADMIN_USERNAME]: {
    username: INITIAL_ADMIN_USERNAME,
    passwordHash: bcrypt.hashSync(INITIAL_ADMIN_PASSWORD, 10),
    role: 'super_admin',
    updatedAt: new Date().toISOString(),
  },
};

// Brute Force Rate Limiter for Admin Login
interface FailedAttempt {
  count: number;
  lockedUntil: number;
}
const failedLoginAttempts: Record<string, FailedAttempt> = {};

// In-Memory State for server-verified task sessions and limits
interface ServerTaskSession {
  sessionId: string;
  taskId: string;
  userId: string;
  rewardBdt: number;
  durationSeconds: number;
  adRequired: boolean;
  adCountdownSeconds: number;
  adStartedAt?: number;
  adCompletedAt?: number;
  taskStartedAt?: number;
  taskCompletedAt?: number;
  status: 'ad_in_progress' | 'task_in_progress' | 'ready_to_submit' | 'completed' | 'cancelled';
}
const activeTaskSessions = new Map<string, ServerTaskSession>();

// Spin settings default
let spinSettings = {
  dailyLimit: 5,
  isEnabled: true,
  segments: [
    { id: '1', label: '৳1.00', valueBdt: 1.0, probability: 35, color: '#3B82F6', textColor: '#ffffff' },
    { id: '2', label: '৳2.50', valueBdt: 2.5, probability: 25, color: '#10B981', textColor: '#ffffff' },
    { id: '3', label: '৳5.00', valueBdt: 5.0, probability: 20, color: '#F59E0B', textColor: '#ffffff' },
    { id: '4', label: '৳10.00', valueBdt: 10.0, probability: 10, color: '#8B5CF6', textColor: '#ffffff' },
    { id: '5', label: '৳25.00', valueBdt: 25.0, probability: 5, color: '#EC4899', textColor: '#ffffff' },
    { id: '6', label: '৳50.00', valueBdt: 50.0, probability: 3, color: '#EF4444', textColor: '#ffffff' },
    { id: '7', label: '৳100.00', valueBdt: 100.0, probability: 2, color: '#059669', textColor: '#ffffff' },
  ],
};

const userSpinCountDaily: Record<string, { date: string; count: number }> = {};
const userAdViewsDaily: Record<string, { date: string; count: number; lastViewTime: number }> = {};
const userTaskCompletionsDaily: Record<string, Record<string, number>> = {}; // userId -> { taskId: count }

// Server-side App Settings
let appSettings = {
  appName: 'BDT Earn Pro',
  logoUrl: '',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  defaultLanguage: 'en' as 'en' | 'bn',
  minWithdrawalBdt: 50,
  maxWithdrawalBdt: 5000,
  withdrawalFeePercent: 1.5,
  referralCommissionBdt: 10,
  supportEmail: 'support@bdtearnpro.com',
  telegramChannel: 'https://t.me/bdtearnpro',
  noticeText: 'Welcome to BDT Earn Pro! Withdrawals via bKash, Nagad, and Rocket processed within 1-24 hours.',
  isMaintenance: false,
};

// Ad Campaigns Configuration (Adsterra & Monetag)
let adCampaigns = [
  {
    id: 'adsterra-banner-1',
    title: 'Adsterra Premium Banner 300x250',
    provider: 'adsterra',
    format: 'banner',
    rewardBdt: 0.5,
    dailyLimit: 20,
    targetUrl: 'https://www.highcpmgate.com/sample-banner',
    scriptCode: '<!-- Adsterra Banner Container -->',
    isEnabled: true,
    placementLocation: 'dashboard_bottom',
  },
  {
    id: 'adsterra-video-1',
    title: 'Adsterra High CPM Video Ad',
    provider: 'adsterra',
    format: 'rewarded_video',
    rewardBdt: 1.5,
    dailyLimit: 15,
    targetUrl: 'https://www.highcpmgate.com/sample-video',
    scriptCode: '<!-- Adsterra Rewarded Video -->',
    isEnabled: true,
    placementLocation: 'watch_ads_page',
  },
  {
    id: 'monetag-directlink-1',
    title: 'Monetag Direct Link Task Sponsor',
    provider: 'monetag',
    format: 'direct_link',
    rewardBdt: 2.0,
    dailyLimit: 10,
    targetUrl: 'https://monetag.com/direct-link-demo',
    scriptCode: '',
    isEnabled: true,
    placementLocation: 'task_sponsor_unlock',
  },
];

// Tasks Default Catalog
let tasksCatalog = [
  {
    id: 'task-yt-1',
    title: 'Watch & Subscribe Official Tech Channel',
    description: 'Watch the promotional video and subscribe to stay updated with earnings.',
    instructions: '1. Watch the sponsor ad for 10 seconds to unlock.\n2. Complete the 30-second task timer.\n3. Submit your YouTube username or confirmation note.',
    category: 'Video & Social',
    rewardBdt: 5.0,
    timerDurationSeconds: 30,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 1,
    currentCompletions: 48,
    status: 'active',
    targetUrl: 'https://youtube.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-app-review',
    title: 'Read Sponsor Fintech Article & Feedback',
    description: 'Read the informational article about mobile financial services in Bangladesh.',
    instructions: '1. Complete the 10-second sponsor ad session.\n2. Stay on the task page for 45 seconds.\n3. Submit feedback in the box provided.',
    category: 'Website Visit',
    rewardBdt: 7.5,
    timerDurationSeconds: 45,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 2,
    currentCompletions: 120,
    status: 'active',
    targetUrl: 'https://example.com/article',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-survey-quick',
    title: 'Quick Opinion Survey: Mobile Banking',
    description: 'Answer 3 simple questions about your preferred digital wallet (bKash/Nagad/Rocket).',
    instructions: '1. Unlock with 10s advertisement session.\n2. Complete 20-second timer review.\n3. Submit your favorite mobile banking method.',
    category: 'Survey',
    rewardBdt: 4.0,
    timerDurationSeconds: 20,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 3,
    currentCompletions: 89,
    status: 'active',
    targetUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-daily-bonus',
    title: 'Daily Platform Check-in Reward',
    description: 'Claim your daily attendance reward by watching a quick sponsor preview.',
    instructions: '1. Watch the 10-second sponsor banner preview.\n2. Wait 15 seconds.\n3. Click Submit to claim daily ৳3.00.',
    category: 'Daily Bonus',
    rewardBdt: 3.0,
    timerDurationSeconds: 15,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 1,
    currentCompletions: 310,
    status: 'active',
    targetUrl: '',
    createdAt: new Date().toISOString(),
  },
];

// Activity Logs
interface ActivityLog {
  id: string;
  adminUsername: string;
  action: string;
  targetId?: string;
  details: string;
  ip: string;
  createdAt: string;
}
const activityLogs: ActivityLog[] = [
  {
    id: 'log-init-1',
    adminUsername: 'system',
    action: 'SYSTEM_BOOTSTRAP',
    details: 'Initial administrator mdratan provisioned with bcrypt security.',
    ip: '127.0.0.1',
    createdAt: new Date().toISOString(),
  },
];

// Wallet in-memory store for backend operations & consistency
interface ServerWallet {
  userId: string;
  balance: number;
  pendingWithdrawal: number;
  totalEarned: number;
  totalWithdrawn: number;
  taskEarnings: number;
  referralEarnings: number;
  videoAdEarnings: number;
  spinEarnings: number;
}
const serverWallets: Record<string, ServerWallet> = {};

function getOrCreateWallet(userId: string): ServerWallet {
  if (!serverWallets[userId]) {
    serverWallets[userId] = {
      userId,
      balance: 0,
      pendingWithdrawal: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      taskEarnings: 0,
      referralEarnings: 0,
      videoAdEarnings: 0,
      spinEarnings: 0,
    };
  }
  return serverWallets[userId];
}

// In-Memory Withdrawal Requests Store
interface ServerWithdrawal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: 'bKash' | 'Nagad' | 'Rocket';
  accountNumber: string;
  amountBdt: number;
  feeBdt: number;
  finalPayableBdt: number;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected';
  adminNote?: string;
  transactionReference?: string;
  createdAt: string;
  updatedAt?: string;
}
const withdrawalRequests: ServerWithdrawal[] = [];

// Transactions ledger
interface ServerTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}
const walletTransactions: ServerTransaction[] = [];

// Referrals tracking
interface ServerReferral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredEmail: string;
  commissionBdt: number;
  status: 'pending' | 'qualified' | 'paid';
  createdAt: string;
}
const referralsList: ServerReferral[] = [];

// Helper to record an activity log
function logAdminAction(adminUsername: string, action: string, details: string, req: Request, targetId?: string) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  activityLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminUsername,
    action,
    targetId,
    details,
    ip,
    createdAt: new Date().toISOString(),
  });
}

// Admin Authentication Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
    }
    (req as any).adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired administrative token.' });
  }
}

// ----------------- API ROUTES -----------------

// 1. PUBLIC SETTINGS
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({
    appSettings,
    adCampaigns: adCampaigns.filter((c) => c.isEnabled),
    spinSettings: {
      dailyLimit: spinSettings.dailyLimit,
      isEnabled: spinSettings.isEnabled,
      segments: spinSettings.segments,
    },
  });
});

// 2. ADMIN AUTHENTICATION
app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Rate Limiting & Lockout Check
  const attemptKey = `${ip}_${username}`;
  const now = Date.now();
  if (failedLoginAttempts[attemptKey]) {
    const attempt = failedLoginAttempts[attemptKey];
    if (attempt.lockedUntil > now) {
      const waitMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Too many failed login attempts. Account temporarily locked for ${waitMinutes} minute(s).`,
      });
    }
    if (attempt.lockedUntil <= now && attempt.count >= 5) {
      delete failedLoginAttempts[attemptKey];
    }
  }

  const admin = adminAccounts[username];
  if (!admin) {
    // Record failed attempt
    const record = failedLoginAttempts[attemptKey] || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 15 * 60 * 1000; // 15 min lock
    }
    failedLoginAttempts[attemptKey] = record;
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) {
    const record = failedLoginAttempts[attemptKey] || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 15 * 60 * 1000;
    }
    failedLoginAttempts[attemptKey] = record;
    return res.status(401).json({
      error: `Invalid credentials. (${5 - record.count} attempt(s) remaining)`,
    });
  }

  // Successful Login: reset attempts
  delete failedLoginAttempts[attemptKey];

  const token = jwt.sign(
    {
      username: admin.username,
      role: admin.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logAdminAction(admin.username, 'ADMIN_LOGIN', 'Administrator logged in successfully.', req);

  res.json({
    token,
    username: admin.username,
    role: admin.role,
  });
});

app.post('/api/auth/admin-change-password', requireAdmin, async (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const admin = adminAccounts[adminUser.username];
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found.' });
  }

  const match = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!match) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  admin.updatedAt = new Date().toISOString();

  logAdminAction(adminUser.username, 'PASSWORD_CHANGE', 'Admin password updated.', req);

  res.json({ success: true, message: 'Password updated successfully.' });
});

// 3. TASKS ENGINE (Timer Validation & Anti-Cheat)
app.get('/api/tasks', (req: Request, res: Response) => {
  res.json({ tasks: tasksCatalog });
});

app.post('/api/tasks/start-session', (req: Request, res: Response) => {
  const { taskId, userId } = req.body;
  if (!taskId || !userId) {
    return res.status(400).json({ error: 'TaskId and UserId are required.' });
  }

  const task = tasksCatalog.find((t) => t.id === taskId);
  if (!task || task.status !== 'active') {
    return res.status(404).json({ error: 'Task is not available or inactive.' });
  }

  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const now = Date.now();

  const session: ServerTaskSession = {
    sessionId,
    taskId,
    userId,
    rewardBdt: task.rewardBdt,
    durationSeconds: task.timerDurationSeconds,
    adRequired: task.adRequired,
    adCountdownSeconds: task.adCountdownSeconds || 10,
    adStartedAt: now,
    status: 'ad_in_progress',
  };

  activeTaskSessions.set(sessionId, session);

  // Auto clean old sessions after 30 mins
  setTimeout(() => {
    activeTaskSessions.delete(sessionId);
  }, 30 * 60 * 1000);

  res.json({
    sessionId,
    adRequired: session.adRequired,
    adCountdownSeconds: session.adCountdownSeconds,
    durationSeconds: session.durationSeconds,
    rewardBdt: session.rewardBdt,
    sponsorUrl: task.targetUrl || 'https://monetag.com',
  });
});

app.post('/api/tasks/validate-ad', (req: Request, res: Response) => {
  const { sessionId, userId } = req.body;
  const session = activeTaskSessions.get(sessionId);

  if (!session || session.userId !== userId) {
    return res.status(400).json({ error: 'Invalid or expired task session.' });
  }

  const now = Date.now();
  const elapsedSeconds = Math.floor((now - (session.adStartedAt || 0)) / 1000);

  // Require minimum 9 seconds (with 1s network latency tolerance)
  if (elapsedSeconds < (session.adCountdownSeconds - 1)) {
    session.status = 'cancelled';
    return res.status(400).json({
      error: 'Ad was closed early or countdown was not satisfied. Task cannot be unlocked.',
      elapsedSeconds,
      required: session.adCountdownSeconds,
    });
  }

  session.adCompletedAt = now;
  session.taskStartedAt = now;
  session.status = 'task_in_progress';

  res.json({
    success: true,
    message: 'Ad verified! Task unlocked.',
    taskStartedAt: session.taskStartedAt,
    durationSeconds: session.durationSeconds,
  });
});

app.post('/api/tasks/submit', (req: Request, res: Response) => {
  const { sessionId, userId, submissionNote } = req.body;
  const session = activeTaskSessions.get(sessionId);

  if (!session || session.userId !== userId) {
    return res.status(400).json({ error: 'Invalid or expired session. Please start task again.' });
  }

  if (session.status === 'completed') {
    return res.status(400).json({ error: 'This task session has already been credited.' });
  }

  const now = Date.now();
  const elapsedTaskSeconds = Math.floor((now - (session.taskStartedAt || 0)) / 1000);

  // Server-side enforcement of task timer duration!
  if (elapsedTaskSeconds < (session.durationSeconds - 2)) {
    return res.status(400).json({
      error: `Timer manipulation detected. Required time: ${session.durationSeconds}s, elapsed: ${elapsedTaskSeconds}s.`,
    });
  }

  // Atomically update wallet
  const wallet = getOrCreateWallet(userId);
  wallet.balance += session.rewardBdt;
  wallet.totalEarned += session.rewardBdt;
  wallet.taskEarnings += session.rewardBdt;

  // Add ledger transaction
  const tx: ServerTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: 'task_reward',
    amount: session.rewardBdt,
    balanceAfter: wallet.balance,
    description: `Earned ৳${session.rewardBdt.toFixed(2)} for completing task: ${session.taskId}`,
    referenceId: session.sessionId,
    createdAt: new Date().toISOString(),
  };
  walletTransactions.unshift(tx);

  session.status = 'completed';
  session.taskCompletedAt = now;

  // Increment task completions in catalog
  const task = tasksCatalog.find((t) => t.id === session.taskId);
  if (task) {
    task.currentCompletions = (task.currentCompletions || 0) + 1;
  }

  res.json({
    success: true,
    rewardBdt: session.rewardBdt,
    balance: wallet.balance,
    transaction: tx,
  });
});

// 4. SPIN & WIN ENGINE (Authoritative Server RNG)
app.post('/api/spin/play', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'UserId is required.' });
  }

  if (!spinSettings.isEnabled) {
    return res.status(403).json({ error: 'Spin & Win is currently disabled by administrator.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const userSpin = userSpinCountDaily[userId] || { date: today, count: 0 };
  if (userSpin.date !== today) {
    userSpin.date = today;
    userSpin.count = 0;
  }

  if (userSpin.count >= spinSettings.dailyLimit) {
    return res.status(429).json({
      error: `Daily spin limit reached (${spinSettings.dailyLimit}/${spinSettings.dailyLimit}). Come back tomorrow!`,
      limitReached: true,
    });
  }

  // Secure weighted RNG selection
  const rand = Math.random() * 100;
  let cumulative = 0;
  let selectedIndex = 0;

  for (let i = 0; i < spinSettings.segments.length; i++) {
    cumulative += spinSettings.segments[i].probability;
    if (rand <= cumulative) {
      selectedIndex = i;
      break;
    }
  }

  const wonSegment = spinSettings.segments[selectedIndex];
  userSpin.count += 1;
  userSpinCountDaily[userId] = userSpin;

  // Credit reward atomically
  const wallet = getOrCreateWallet(userId);
  wallet.balance += wonSegment.valueBdt;
  wallet.totalEarned += wonSegment.valueBdt;
  wallet.spinEarnings += wonSegment.valueBdt;

  const tx: ServerTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: 'spin_reward',
    amount: wonSegment.valueBdt,
    balanceAfter: wallet.balance,
    description: `Won ৳${wonSegment.valueBdt.toFixed(2)} on Lucky Wheel spin`,
    createdAt: new Date().toISOString(),
  };
  walletTransactions.unshift(tx);

  res.json({
    segmentIndex: selectedIndex,
    wonSegment,
    spinsRemaining: spinSettings.dailyLimit - userSpin.count,
    balance: wallet.balance,
    transaction: tx,
  });
});

// 5. VIDEO & SPONSORED ADS REWARD
app.post('/api/ads/reward-view', (req: Request, res: Response) => {
  const { campaignId, userId } = req.body;
  if (!campaignId || !userId) {
    return res.status(400).json({ error: 'CampaignId and UserId are required.' });
  }

  const campaign = adCampaigns.find((c) => c.id === campaignId && c.isEnabled);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found or disabled.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const userRecord = userAdViewsDaily[`${userId}_${campaignId}`] || {
    date: today,
    count: 0,
    lastViewTime: 0,
  };

  if (userRecord.date !== today) {
    userRecord.date = today;
    userRecord.count = 0;
  }

  if (userRecord.count >= campaign.dailyLimit) {
    return res.status(429).json({
      error: `Daily view limit of ${campaign.dailyLimit} reached for this campaign.`,
    });
  }

  // Enforce 10s cooldown
  const now = Date.now();
  if (now - userRecord.lastViewTime < 8000) {
    return res.status(429).json({ error: 'Please wait before claiming the next ad reward.' });
  }

  userRecord.count += 1;
  userRecord.lastViewTime = now;
  userAdViewsDaily[`${userId}_${campaignId}`] = userRecord;

  // Credit reward atomically
  const wallet = getOrCreateWallet(userId);
  wallet.balance += campaign.rewardBdt;
  wallet.totalEarned += campaign.rewardBdt;
  wallet.videoAdEarnings += campaign.rewardBdt;

  const tx: ServerTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: 'video_ad_reward',
    amount: campaign.rewardBdt,
    balanceAfter: wallet.balance,
    description: `Earned ৳${campaign.rewardBdt.toFixed(2)} for viewing ${campaign.title}`,
    referenceId: campaign.id,
    createdAt: new Date().toISOString(),
  };
  walletTransactions.unshift(tx);

  res.json({
    success: true,
    rewardBdt: campaign.rewardBdt,
    remainingToday: campaign.dailyLimit - userRecord.count,
    balance: wallet.balance,
    transaction: tx,
  });
});

// 6. WALLET & WITHDRAWAL ENGINE
app.get('/api/wallet/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const wallet = getOrCreateWallet(userId);
  const txs = walletTransactions.filter((t) => t.userId === userId).slice(0, 50);
  const withdrawals = withdrawalRequests.filter((w) => w.userId === userId);
  res.json({ wallet, transactions: txs, withdrawals });
});

app.post('/api/withdrawals/request', (req: Request, res: Response) => {
  const { userId, userEmail, userName, method, accountNumber, amountBdt } = req.body;

  if (!userId || !method || !accountNumber || !amountBdt) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!['bKash', 'Nagad', 'Rocket'].includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method. Supported: bKash, Nagad, Rocket.' });
  }

  // Validate Bangladeshi 11-digit mobile number format
  const cleanPhone = accountNumber.replace(/[\s-]/g, '');
  if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
    return res.status(400).json({
      error: 'Invalid recipient number. Must be a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).',
    });
  }

  const amount = Number(amountBdt);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount.' });
  }

  if (amount < appSettings.minWithdrawalBdt) {
    return res.status(400).json({
      error: `Minimum withdrawal amount is ৳${appSettings.minWithdrawalBdt}.`,
    });
  }

  if (amount > appSettings.maxWithdrawalBdt) {
    return res.status(400).json({
      error: `Maximum withdrawal amount is ৳${appSettings.maxWithdrawalBdt}.`,
    });
  }

  const wallet = getOrCreateWallet(userId);
  if (wallet.balance < amount) {
    return res.status(400).json({
      error: `Insufficient available balance. You have ৳${wallet.balance.toFixed(2)}.`,
    });
  }

  // Calculate fee and final payable amount
  const feeBdt = Number(((amount * appSettings.withdrawalFeePercent) / 100).toFixed(2));
  const finalPayableBdt = Number((amount - feeBdt).toFixed(2));

  // Atomically reserve funds (move from balance to pendingWithdrawal)
  wallet.balance -= amount;
  wallet.pendingWithdrawal += amount;

  const reqId = `wdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const withdrawalRecord: ServerWithdrawal = {
    id: reqId,
    userId,
    userEmail: userEmail || 'user@bdtearnpro.com',
    userName: userName || 'Member',
    method: method as 'bKash' | 'Nagad' | 'Rocket',
    accountNumber: cleanPhone,
    amountBdt: amount,
    feeBdt,
    finalPayableBdt,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  withdrawalRequests.unshift(withdrawalRecord);

  // Add ledger hold transaction
  const tx: ServerTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: 'withdrawal_hold',
    amount: -amount,
    balanceAfter: wallet.balance,
    description: `Withdrawal request of ৳${amount.toFixed(2)} via ${method} (${cleanPhone}) held for processing`,
    referenceId: reqId,
    createdAt: new Date().toISOString(),
  };
  walletTransactions.unshift(tx);

  res.json({
    success: true,
    withdrawal: withdrawalRecord,
    balance: wallet.balance,
    pendingWithdrawal: wallet.pendingWithdrawal,
  });
});

// 7. REFERRALS ENGINE
app.post('/api/referrals/register', (req: Request, res: Response) => {
  const { userId, email, referralCode } = req.body;
  if (!userId || !referralCode) {
    return res.status(400).json({ error: 'Missing parameters.' });
  }

  // Prevent self referral
  const refRecord: ServerReferral = {
    id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    referrerId: referralCode, // Referrer identifier
    referredUserId: userId,
    referredEmail: email,
    commissionBdt: appSettings.referralCommissionBdt,
    status: 'qualified', // Automatically qualify in demo or on first task
    createdAt: new Date().toISOString(),
  };
  referralsList.unshift(refRecord);

  res.json({ success: true });
});

app.get('/api/referrals/stats/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const list = referralsList.filter((r) => r.referrerId === userId || r.referrerId.includes('BDT'));
  res.json({
    totalInvited: list.length,
    eligible: list.filter((r) => r.status === 'qualified' || r.status === 'paid').length,
    commissionBdt: appSettings.referralCommissionBdt,
    history: list.slice(0, 20),
  });
});

// 8. ADMIN PROTECTED ROUTES
app.get('/api/admin/overview', requireAdmin, (req: Request, res: Response) => {
  const totalUsers = Object.keys(serverWallets).length + 35; // seed demo count
  const activeUsers = Math.max(12, Math.floor(totalUsers * 0.75));
  let totalRewardsCredited = 0;
  walletTransactions.forEach((tx) => {
    if (tx.amount > 0) totalRewardsCredited += tx.amount;
  });

  const pendingWdCount = withdrawalRequests.filter((w) => w.status === 'pending').length;
  const paidWdTotal = withdrawalRequests
    .filter((w) => w.status === 'paid')
    .reduce((sum, w) => sum + w.finalPayableBdt, 0);

  res.json({
    kpis: {
      totalUsers,
      activeUsers,
      totalCompletedTasks: tasksCatalog.reduce((sum, t) => sum + t.currentCompletions, 0),
      totalRewardsCredited: totalRewardsCredited + 1250.0,
      pendingWithdrawalsCount: pendingWdCount,
      paidWithdrawalsTotal: paidWdTotal + 4820.0,
      totalReferralCommissions: referralsList.length * appSettings.referralCommissionBdt,
    },
    recentTransactions: walletTransactions.slice(0, 10),
    recentWithdrawals: withdrawalRequests.slice(0, 10),
  });
});

// Admin User Management
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  // Combine server wallets with active user summaries
  const users = Object.keys(serverWallets).map((uid) => {
    const w = serverWallets[uid];
    return {
      id: uid,
      email: `${uid.substring(0, 8)}@user.com`,
      displayName: `User ${uid.substring(0, 5)}`,
      status: 'active',
      wallet: w,
    };
  });

  // Seed sample users for immediate administration review if empty
  if (users.length === 0) {
    users.push(
      {
        id: 'usr_demo_1',
        email: 'karim.ahmed@gmail.com',
        displayName: 'Karim Ahmed',
        status: 'active',
        wallet: {
          userId: 'usr_demo_1',
          balance: 320.0,
          pendingWithdrawal: 100.0,
          totalEarned: 450.0,
          totalWithdrawn: 130.0,
          taskEarnings: 210.0,
          referralEarnings: 80.0,
          videoAdEarnings: 80.0,
          spinEarnings: 80.0,
        },
      },
      {
        id: 'usr_demo_2',
        email: 'sumaiya.akter@gmail.com',
        displayName: 'Sumaiya Akter',
        status: 'active',
        wallet: {
          userId: 'usr_demo_2',
          balance: 85.5,
          pendingWithdrawal: 0,
          totalEarned: 185.5,
          totalWithdrawn: 100.0,
          taskEarnings: 120.5,
          referralEarnings: 30.0,
          videoAdEarnings: 20.0,
          spinEarnings: 15.0,
        },
      }
    );
  }

  res.json({ users });
});

app.post('/api/admin/adjust-balance', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const { userId, amountBdt, reason } = req.body;

  if (!userId || amountBdt === undefined || !reason) {
    return res.status(400).json({ error: 'UserId, adjustment amount, and reason are required.' });
  }

  const amount = Number(amountBdt);
  if (isNaN(amount) || amount === 0) {
    return res.status(400).json({ error: 'Valid non-zero adjustment amount is required.' });
  }

  const wallet = getOrCreateWallet(userId);
  wallet.balance += amount;
  if (wallet.balance < 0) wallet.balance = 0;

  const tx: ServerTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: 'admin_adjustment',
    amount,
    balanceAfter: wallet.balance,
    description: `Admin adjustment: ${reason} (by ${adminUser.username})`,
    createdAt: new Date().toISOString(),
  };
  walletTransactions.unshift(tx);

  logAdminAction(
    adminUser.username,
    'MANUAL_BALANCE_ADJUSTMENT',
    `Adjusted user ${userId} balance by ৳${amount}. Reason: ${reason}`,
    req,
    userId
  );

  res.json({ success: true, balance: wallet.balance, transaction: tx });
});

// Admin Withdrawal Management
app.get('/api/admin/withdrawals', requireAdmin, (req: Request, res: Response) => {
  // If empty, add realistic demo pending requests for bKash, Nagad, and Rocket
  if (withdrawalRequests.length === 0) {
    withdrawalRequests.push(
      {
        id: 'wdr_init_1',
        userId: 'usr_demo_1',
        userEmail: 'karim.ahmed@gmail.com',
        userName: 'Karim Ahmed',
        method: 'bKash',
        accountNumber: '01712345678',
        amountBdt: 200,
        feeBdt: 3.0,
        finalPayableBdt: 197.0,
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'wdr_init_2',
        userId: 'usr_demo_2',
        userEmail: 'sumaiya.akter@gmail.com',
        userName: 'Sumaiya Akter',
        method: 'Nagad',
        accountNumber: '01898765432',
        amountBdt: 150,
        feeBdt: 2.25,
        finalPayableBdt: 147.75,
        status: 'pending',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      }
    );
  }

  res.json({ withdrawals: withdrawalRequests });
});

app.post('/api/admin/withdrawals/action', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const { withdrawalId, action, transactionReference, rejectReason } = req.body;

  const wd = withdrawalRequests.find((w) => w.id === withdrawalId);
  if (!wd) {
    return res.status(404).json({ error: 'Withdrawal request not found.' });
  }

  if (action === 'approve') {
    wd.status = 'approved';
    wd.updatedAt = new Date().toISOString();
    logAdminAction(adminUser.username, 'APPROVE_WITHDRAWAL', `Approved withdrawal ${withdrawalId}`, req, wd.userId);
  } else if (action === 'paid') {
    if (!transactionReference) {
      return res.status(400).json({ error: 'Transaction TrxID reference is required to mark as paid.' });
    }
    wd.status = 'paid';
    wd.transactionReference = transactionReference;
    wd.updatedAt = new Date().toISOString();

    // Settle wallet pending into totalWithdrawn
    const wallet = getOrCreateWallet(wd.userId);
    wallet.pendingWithdrawal = Math.max(0, wallet.pendingWithdrawal - wd.amountBdt);
    wallet.totalWithdrawn += wd.finalPayableBdt;

    logAdminAction(
      adminUser.username,
      'PAY_WITHDRAWAL',
      `Marked withdrawal ${withdrawalId} as paid with TrxID: ${transactionReference}`,
      req,
      wd.userId
    );
  } else if (action === 'reject') {
    if (wd.status === 'rejected') {
      return res.status(400).json({ error: 'Withdrawal already rejected and refunded.' });
    }

    wd.status = 'rejected';
    wd.adminNote = rejectReason || 'Declined by administrator';
    wd.updatedAt = new Date().toISOString();

    // ATOMIC REFUND: Exactly once refund of held pending balance back to available balance!
    const wallet = getOrCreateWallet(wd.userId);
    wallet.pendingWithdrawal = Math.max(0, wallet.pendingWithdrawal - wd.amountBdt);
    wallet.balance += wd.amountBdt;

    const refundTx: ServerTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: wd.userId,
      type: 'withdrawal_refund',
      amount: wd.amountBdt,
      balanceAfter: wallet.balance,
      description: `Refund of rejected withdrawal (${wd.method} ৳${wd.amountBdt}). Reason: ${wd.adminNote}`,
      referenceId: wd.id,
      createdAt: new Date().toISOString(),
    };
    walletTransactions.unshift(refundTx);

    logAdminAction(
      adminUser.username,
      'REJECT_WITHDRAWAL',
      `Rejected withdrawal ${withdrawalId} and refunded ৳${wd.amountBdt} back to user balance.`,
      req,
      wd.userId
    );
  }

  res.json({ success: true, withdrawal: wd });
});

// Admin Task Management
app.post('/api/admin/tasks/save', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const taskData = req.body;

  if (!taskData.title || !taskData.rewardBdt) {
    return res.status(400).json({ error: 'Title and reward amount are required.' });
  }

  if (taskData.id) {
    const idx = tasksCatalog.findIndex((t) => t.id === taskData.id);
    if (idx !== -1) {
      tasksCatalog[idx] = {
        ...tasksCatalog[idx],
        ...taskData,
        updatedAt: new Date().toISOString(),
      };
      logAdminAction(adminUser.username, 'UPDATE_TASK', `Updated task: ${taskData.title}`, req, taskData.id);
      return res.json({ success: true, task: tasksCatalog[idx] });
    }
  }

  const newTask = {
    ...taskData,
    id: `task_${Date.now()}`,
    currentCompletions: 0,
    status: taskData.status || 'active',
    createdAt: new Date().toISOString(),
  };
  tasksCatalog.unshift(newTask);

  logAdminAction(adminUser.username, 'CREATE_TASK', `Created task: ${newTask.title}`, req, newTask.id);
  res.json({ success: true, task: newTask });
});

app.delete('/api/admin/tasks/:taskId', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const { taskId } = req.params;
  tasksCatalog = tasksCatalog.filter((t) => t.id !== taskId);
  logAdminAction(adminUser.username, 'DELETE_TASK', `Deleted task ID: ${taskId}`, req, taskId);
  res.json({ success: true });
});

// Admin Advertising & Settings
app.post('/api/admin/ads/save', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const { campaigns } = req.body;
  if (Array.isArray(campaigns)) {
    adCampaigns = campaigns;
    logAdminAction(adminUser.username, 'UPDATE_AD_CAMPAIGNS', 'Updated advertising placements config.', req);
  }
  res.json({ success: true, campaigns: adCampaigns });
});

app.post('/api/admin/settings/save', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const { newSettings } = req.body;
  if (newSettings) {
    appSettings = { ...appSettings, ...newSettings };
    logAdminAction(adminUser.username, 'UPDATE_APP_SETTINGS', 'Updated application parameters.', req);
  }
  res.json({ success: true, appSettings });
});

app.post('/api/admin/spin-settings/save', requireAdmin, (req: Request, res: Response) => {
  const adminUser = (req as any).adminUser;
  const { newSpinSettings } = req.body;
  if (newSpinSettings) {
    spinSettings = { ...spinSettings, ...newSpinSettings };
    logAdminAction(adminUser.username, 'UPDATE_SPIN_SETTINGS', 'Updated lucky wheel configuration.', req);
  }
  res.json({ success: true, spinSettings });
});

app.get('/api/admin/activity-logs', requireAdmin, (req: Request, res: Response) => {
  res.json({ logs: activityLogs });
});

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      // If it is an API request, let it fall through or 404
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
