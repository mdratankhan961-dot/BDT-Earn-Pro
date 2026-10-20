var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var JWT_SECRET = process.env.ADMIN_JWT_SECRET || "bdt-earn-pro-super-secret-jwt-key-2026";
var SESSION_SECRET = process.env.SESSION_SECRET || "bdt-task-session-crypt-secret";
app.use((0, import_cors.default)());
app.use(import_express.default.json());
app.use((req, _res, next) => {
  if (req.url.startsWith("/.netlify/functions/api")) {
    req.url = req.url.replace("/.netlify/functions/api", "/api");
  }
  next();
});
var INITIAL_ADMIN_USERNAME = process.env.ADMIN_INITIAL_USERNAME || "Md Ratan";
var INITIAL_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || "Ratan789#%";
var INITIAL_ADMIN_EMAIL = process.env.ADMIN_INITIAL_EMAIL || "mdratankhan961@gmail.com";
var initialAdminHash = import_bcryptjs.default.hashSync(INITIAL_ADMIN_PASSWORD, 10);
var adminAccounts = {
  [INITIAL_ADMIN_USERNAME]: {
    username: INITIAL_ADMIN_USERNAME,
    email: INITIAL_ADMIN_EMAIL,
    passwordHash: initialAdminHash,
    role: "super_admin",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  "mdratan": {
    username: INITIAL_ADMIN_USERNAME,
    email: INITIAL_ADMIN_EMAIL,
    passwordHash: initialAdminHash,
    role: "super_admin",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  "md ratan": {
    username: INITIAL_ADMIN_USERNAME,
    email: INITIAL_ADMIN_EMAIL,
    passwordHash: initialAdminHash,
    role: "super_admin",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  [INITIAL_ADMIN_EMAIL.toLowerCase()]: {
    username: INITIAL_ADMIN_USERNAME,
    email: INITIAL_ADMIN_EMAIL,
    passwordHash: initialAdminHash,
    role: "super_admin",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
};
var failedLoginAttempts = {};
var activeTaskSessions = /* @__PURE__ */ new Map();
var globalAdSettings = {
  adsterraSmartLink: "https://www.highcpmgate.com/sample-smartlink",
  monetagDirectLink: "https://monetag.com/direct-link-demo",
  defaultYoutubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  activeProvider: "adsterra",
  adCountdownSeconds: 10
};
var spinSettings = {
  dailyLimit: 5,
  isEnabled: true,
  segments: [
    { id: "1", label: "\u09F31.00", valueBdt: 1, probability: 35, color: "#3B82F6", textColor: "#ffffff" },
    { id: "2", label: "\u09F32.00", valueBdt: 2, probability: 25, color: "#10B981", textColor: "#ffffff" },
    { id: "3", label: "\u09F35.00", valueBdt: 5, probability: 20, color: "#F59E0B", textColor: "#ffffff" },
    { id: "4", label: "\u09F310.00", valueBdt: 10, probability: 10, color: "#8B5CF6", textColor: "#ffffff" },
    { id: "5", label: "\u09F325.00", valueBdt: 25, probability: 5, color: "#EC4899", textColor: "#ffffff" },
    { id: "6", label: "\u09F350.00", valueBdt: 50, probability: 3, color: "#EF4444", textColor: "#ffffff" },
    { id: "7", label: "\u09F3100.00", valueBdt: 100, probability: 2, color: "#059669", textColor: "#ffffff" }
  ]
};
var payoutSettings = {
  defaultTaskRewardBdt: 5,
  watchAndEarnRewardBdt: 1.5,
  referralCommissionBdt: 10,
  dailySpinLimit: 5
};
var userStatusMap = {};
var userPointsMap = {};
var userSpinCountDaily = {};
var userAdViewsDaily = {};
var appSettings = {
  appName: "BDT Earn Pro",
  logoUrl: "",
  currencySymbol: "\u09F3",
  currencyCode: "BDT",
  defaultLanguage: "en",
  minWithdrawalBdt: 50,
  maxWithdrawalBdt: 5e3,
  withdrawalFeePercent: 1.5,
  referralCommissionBdt: 10,
  supportEmail: "support@bdtearnpro.com",
  telegramChannel: "https://t.me/bdtearnpro",
  noticeText: "Welcome to BDT Earn Pro! Withdrawals via bKash, Nagad, and Rocket processed within 1-24 hours.",
  isMaintenance: false
};
var adCampaigns = [
  {
    id: "adsterra-banner-1",
    title: "Adsterra Premium Banner 300x250",
    provider: "adsterra",
    format: "banner",
    rewardBdt: 0.5,
    dailyLimit: 20,
    targetUrl: "https://www.highcpmgate.com/sample-banner",
    scriptCode: "<!-- Adsterra Banner Container -->",
    isEnabled: true,
    placementLocation: "dashboard_bottom"
  },
  {
    id: "adsterra-video-1",
    title: "Adsterra High CPM Video Ad",
    provider: "adsterra",
    format: "rewarded_video",
    rewardBdt: 1.5,
    dailyLimit: 15,
    targetUrl: "https://www.highcpmgate.com/sample-video",
    scriptCode: "<!-- Adsterra Rewarded Video -->",
    isEnabled: true,
    placementLocation: "watch_ads_page"
  },
  {
    id: "monetag-directlink-1",
    title: "Monetag Direct Link Task Sponsor",
    provider: "monetag",
    format: "direct_link",
    rewardBdt: 2,
    dailyLimit: 10,
    targetUrl: "https://monetag.com/direct-link-demo",
    scriptCode: "",
    isEnabled: true,
    placementLocation: "task_sponsor_unlock"
  }
];
var tasksCatalog = [
  {
    id: "task-yt-1",
    title: "Watch & Subscribe Official Tech Channel",
    description: "Watch the sponsor advertisement, then watch the promotional YouTube video to claim your cash reward.",
    instructions: '1. Watch the Adsterra/Monetag sponsor ad for 10 seconds.\n2. Click "Watch Now" to watch the assigned YouTube video for 30 seconds.\n3. Click "Claim" to receive your BDT reward directly in your wallet balance.',
    category: "Video & Social",
    rewardBdt: 5,
    timerDurationSeconds: 30,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 1,
    currentCompletions: 48,
    status: "active",
    adProvider: "adsterra",
    adDirectUrl: "https://www.highcpmgate.com/sample-smartlink",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    targetUrl: "https://youtube.com",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "task-app-review",
    title: "Watch Fintech Guide & Earn BDT",
    description: "Complete the sponsor advertisement and watch the mobile financial service video on YouTube.",
    instructions: '1. Complete the 10-second sponsor ad session.\n2. Watch the assigned YouTube video tutorial for 45 seconds.\n3. Click "Claim" to add \u09F37.50 to your account balance.',
    category: "Website Visit",
    rewardBdt: 7.5,
    timerDurationSeconds: 45,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 2,
    currentCompletions: 120,
    status: "active",
    adProvider: "monetag",
    adDirectUrl: "https://monetag.com/direct-link-demo",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    targetUrl: "https://example.com/article",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "task-survey-quick",
    title: "Mobile Banking Video Review",
    description: "Watch the sponsor promotion and complete the quick 20-second YouTube review.",
    instructions: '1. Unlock with 10s sponsor ad session.\n2. Click "Watch Now" to view the video for 20 seconds.\n3. Click "Claim" to receive your \u09F34.00 reward.',
    category: "Survey",
    rewardBdt: 4,
    timerDurationSeconds: 20,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 3,
    currentCompletions: 89,
    status: "active",
    adProvider: "adsterra",
    adDirectUrl: "https://www.highcpmgate.com/sample-smartlink",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    targetUrl: "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "task-daily-bonus",
    title: "Daily Attendance Sponsored Video",
    description: "Claim your daily attendance reward by watching a quick sponsor preview and featured YouTube clip.",
    instructions: '1. Watch the 10-second sponsor ad preview.\n2. Watch the YouTube video for 15 seconds.\n3. Click "Claim" to instantly receive daily \u09F33.00.',
    category: "Daily Bonus",
    rewardBdt: 3,
    timerDurationSeconds: 15,
    adRequired: true,
    adCountdownSeconds: 10,
    dailyLimit: 1,
    currentCompletions: 310,
    status: "active",
    adProvider: "monetag",
    adDirectUrl: "https://monetag.com/direct-link-demo",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    targetUrl: "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var activityLogs = [
  {
    id: "log-init-1",
    adminUsername: "system",
    action: "SYSTEM_BOOTSTRAP",
    details: "Initial administrator mdratan provisioned with bcrypt security.",
    ip: "127.0.0.1",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var serverWallets = {};
var serverRegisteredUsers = {};
function getOrCreateWallet(userId) {
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
      spinEarnings: 0
    };
  }
  return serverWallets[userId];
}
var withdrawalRequests = [];
var walletTransactions = [];
var referralsList = [];
function logAdminAction(adminUsername, action, details, req, targetId) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  activityLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminUsername,
    action,
    targetId,
    details,
    ip,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Admin token required." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== "admin" && decoded.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden. Admin privileges required." });
    }
    req.adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired administrative token." });
  }
}
app.get("/api/settings", (req, res) => {
  res.json({
    appSettings,
    adSettings: globalAdSettings,
    payoutSettings,
    adCampaigns: adCampaigns.filter((c) => c.isEnabled),
    spinSettings: {
      dailyLimit: spinSettings.dailyLimit,
      isEnabled: spinSettings.isEnabled,
      segments: spinSettings.segments
    }
  });
});
app.post("/api/auth/admin-login", async (req, res) => {
  const { username, password } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const attemptKey = `${ip}_${username}`;
  const now = Date.now();
  if (failedLoginAttempts[attemptKey]) {
    const attempt = failedLoginAttempts[attemptKey];
    if (attempt.lockedUntil > now) {
      const waitMinutes = Math.ceil((attempt.lockedUntil - now) / 6e4);
      return res.status(429).json({
        error: `Too many failed login attempts. Account temporarily locked for ${waitMinutes} minute(s).`
      });
    }
    if (attempt.lockedUntil <= now && attempt.count >= 5) {
      delete failedLoginAttempts[attemptKey];
    }
  }
  const trimmed = username.trim();
  const normalized = trimmed.toLowerCase();
  const cleanNoSpaces = normalized.replace(/\s+/g, "");
  const admin = adminAccounts[trimmed] || adminAccounts[normalized] || adminAccounts[cleanNoSpaces] || Object.values(adminAccounts).find((a) => a.username.toLowerCase() === normalized) || Object.values(adminAccounts).find((a) => a.username.toLowerCase().replace(/\s+/g, "") === cleanNoSpaces) || Object.values(adminAccounts).find((a) => a.email && a.email.toLowerCase() === normalized);
  if (!admin) {
    const record = failedLoginAttempts[attemptKey] || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 15 * 60 * 1e3;
    }
    failedLoginAttempts[attemptKey] = record;
    return res.status(401).json({ error: "Invalid username or password." });
  }
  const match = await import_bcryptjs.default.compare(password, admin.passwordHash);
  if (!match) {
    const record = failedLoginAttempts[attemptKey] || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 15 * 60 * 1e3;
    }
    failedLoginAttempts[attemptKey] = record;
    return res.status(401).json({
      error: `Invalid credentials. (${5 - record.count} attempt(s) remaining)`
    });
  }
  delete failedLoginAttempts[attemptKey];
  const token = import_jsonwebtoken.default.sign(
    {
      username: admin.username,
      role: admin.role
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
  logAdminAction(admin.username, "ADMIN_LOGIN", "Administrator logged in successfully.", req);
  res.json({
    token,
    username: admin.username,
    role: admin.role
  });
});
app.post("/api/auth/firebase-admin-verify", async (req, res) => {
  const { email, uid, displayName } = req.body;
  if (!email && !uid) {
    return res.status(400).json({ error: "Firebase authentication details required." });
  }
  const cleanEmail = (email || "").trim().toLowerCase();
  const isSuperAdminEmail = cleanEmail === INITIAL_ADMIN_EMAIL.toLowerCase();
  const isRatanUser = cleanEmail.includes("ratan") || displayName && displayName.toLowerCase().includes("ratan");
  if (!isSuperAdminEmail && !isRatanUser) {
    return res.status(403).json({ error: "Access denied: User is not configured as an administrator." });
  }
  const adminName = displayName || INITIAL_ADMIN_USERNAME;
  const token = import_jsonwebtoken.default.sign(
    {
      username: adminName,
      role: "super_admin",
      firebaseUid: uid,
      email: cleanEmail
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
  logAdminAction(adminName, "FIREBASE_ADMIN_VERIFY", `Admin authenticated through Firebase (${cleanEmail}).`, req);
  res.json({
    token,
    username: adminName,
    role: "super_admin"
  });
});
app.post("/api/auth/admin-change-password", requireAdmin, async (req, res) => {
  const adminUser = req.adminUser;
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters long." });
  }
  const admin = adminAccounts[adminUser.username];
  if (!admin) {
    return res.status(404).json({ error: "Admin account not found." });
  }
  const match = await import_bcryptjs.default.compare(currentPassword, admin.passwordHash);
  if (!match) {
    return res.status(400).json({ error: "Current password is incorrect." });
  }
  admin.passwordHash = await import_bcryptjs.default.hash(newPassword, 10);
  admin.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  logAdminAction(adminUser.username, "PASSWORD_CHANGE", "Admin password updated.", req);
  res.json({ success: true, message: "Password updated successfully." });
});
app.get("/api/tasks", (req, res) => {
  res.json({ tasks: tasksCatalog });
});
app.post("/api/tasks/start-session", (req, res) => {
  const { taskId, userId } = req.body;
  if (!taskId || !userId) {
    return res.status(400).json({ error: "TaskId and UserId are required." });
  }
  const task = tasksCatalog.find((t) => t.id === taskId);
  if (!task || task.status !== "active") {
    return res.status(404).json({ error: "Task is not available or inactive." });
  }
  const sessionId = `sess_${Date.now()}_${import_crypto.default.randomBytes(6).toString("hex")}`;
  const now = Date.now();
  const provider = task.adProvider === "monetag" || task.adProvider === "adsterra" ? task.adProvider : globalAdSettings.activeProvider === "rotate" ? Math.random() > 0.5 ? "adsterra" : "monetag" : globalAdSettings.activeProvider === "monetag" ? "monetag" : "adsterra";
  const adUrl = task.adDirectUrl || (provider === "adsterra" ? globalAdSettings.adsterraSmartLink : globalAdSettings.monetagDirectLink);
  const youtubeUrl = task.youtubeUrl || globalAdSettings.defaultYoutubeUrl;
  const session = {
    sessionId,
    taskId,
    userId,
    rewardBdt: task.rewardBdt,
    durationSeconds: task.timerDurationSeconds || 30,
    adRequired: task.adRequired ?? true,
    adCountdownSeconds: task.adCountdownSeconds || globalAdSettings.adCountdownSeconds || 10,
    adProvider: provider,
    adUrl,
    youtubeUrl,
    adStartedAt: now,
    status: "ad_in_progress"
  };
  activeTaskSessions.set(sessionId, session);
  setTimeout(() => {
    activeTaskSessions.delete(sessionId);
  }, 30 * 60 * 1e3);
  res.json({
    sessionId,
    taskId: task.id,
    taskTitle: task.title,
    adRequired: session.adRequired,
    adCountdownSeconds: session.adCountdownSeconds,
    adProvider: session.adProvider,
    adUrl: session.adUrl,
    youtubeUrl: session.youtubeUrl,
    durationSeconds: session.durationSeconds,
    rewardBdt: session.rewardBdt,
    sponsorUrl: session.adUrl
  });
});
app.post("/api/tasks/validate-ad", (req, res) => {
  const { sessionId, userId } = req.body;
  const session = activeTaskSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(400).json({ error: "Invalid or expired task session." });
  }
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - (session.adStartedAt || 0)) / 1e3);
  if (elapsedSeconds < Math.max(1, session.adCountdownSeconds - 1)) {
    session.status = "cancelled";
    return res.status(400).json({
      error: "Ad was closed early or countdown was not satisfied. Task cannot be unlocked.",
      elapsedSeconds,
      required: session.adCountdownSeconds
    });
  }
  session.adCompletedAt = now;
  session.videoStartedAt = now;
  session.status = "video_in_progress";
  res.json({
    success: true,
    message: "Ad verified! Now proceed to watch the assigned YouTube video.",
    youtubeUrl: session.youtubeUrl,
    videoDurationSeconds: session.durationSeconds,
    taskStartedAt: session.videoStartedAt,
    durationSeconds: session.durationSeconds
  });
});
app.post("/api/tasks/validate-video", (req, res) => {
  const { sessionId, userId } = req.body;
  const session = activeTaskSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(400).json({ error: "Invalid or expired task session." });
  }
  const now = Date.now();
  session.videoCompletedAt = now;
  session.status = "ready_to_claim";
  res.json({
    success: true,
    readyToClaim: true,
    rewardBdt: session.rewardBdt,
    message: "Video watch verified! Click Claim to receive your reward."
  });
});
app.post(["/api/tasks/claim", "/api/tasks/submit"], (req, res) => {
  const { sessionId, userId } = req.body;
  const session = activeTaskSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(400).json({ error: "Invalid or expired session. Please start task again." });
  }
  if (session.status === "completed") {
    return res.status(400).json({ error: "This task reward has already been claimed." });
  }
  const now = Date.now();
  const wallet = getOrCreateWallet(userId);
  wallet.balance += session.rewardBdt;
  wallet.totalEarned += session.rewardBdt;
  wallet.taskEarnings += session.rewardBdt;
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: "task_reward",
    amount: session.rewardBdt,
    balanceAfter: wallet.balance,
    description: `Claimed \u09F3${session.rewardBdt.toFixed(2)} reward for completing task: ${session.taskId}`,
    referenceId: session.sessionId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  walletTransactions.unshift(tx);
  session.status = "completed";
  session.taskCompletedAt = now;
  const task = tasksCatalog.find((t) => t.id === session.taskId);
  if (task) {
    task.currentCompletions = (task.currentCompletions || 0) + 1;
  }
  res.json({
    success: true,
    rewardBdt: session.rewardBdt,
    balance: wallet.balance,
    transaction: tx,
    message: `\u09F3${session.rewardBdt.toFixed(2)} added directly to your account balance!`
  });
});
app.post("/api/spin/play", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "UserId is required." });
  }
  if (!spinSettings.isEnabled) {
    return res.status(403).json({ error: "Spin & Win is currently disabled by administrator." });
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const userSpin = userSpinCountDaily[userId] || { date: today, count: 0 };
  if (userSpin.date !== today) {
    userSpin.date = today;
    userSpin.count = 0;
  }
  if (userSpin.count >= spinSettings.dailyLimit) {
    return res.status(429).json({
      error: `Daily spin limit reached (${spinSettings.dailyLimit}/${spinSettings.dailyLimit}). Come back tomorrow!`,
      limitReached: true
    });
  }
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
  const wallet = getOrCreateWallet(userId);
  wallet.balance += wonSegment.valueBdt;
  wallet.totalEarned += wonSegment.valueBdt;
  wallet.spinEarnings += wonSegment.valueBdt;
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: "spin_reward",
    amount: wonSegment.valueBdt,
    balanceAfter: wallet.balance,
    description: `Won \u09F3${wonSegment.valueBdt.toFixed(2)} on Lucky Wheel spin`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  walletTransactions.unshift(tx);
  res.json({
    segmentIndex: selectedIndex,
    wonSegment,
    spinsRemaining: spinSettings.dailyLimit - userSpin.count,
    balance: wallet.balance,
    transaction: tx
  });
});
app.post("/api/ads/reward-view", (req, res) => {
  const { campaignId, userId } = req.body;
  if (!campaignId || !userId) {
    return res.status(400).json({ error: "CampaignId and UserId are required." });
  }
  const campaign = adCampaigns.find((c) => c.id === campaignId && c.isEnabled);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found or disabled." });
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const userRecord = userAdViewsDaily[`${userId}_${campaignId}`] || {
    date: today,
    count: 0,
    lastViewTime: 0
  };
  if (userRecord.date !== today) {
    userRecord.date = today;
    userRecord.count = 0;
  }
  if (userRecord.count >= campaign.dailyLimit) {
    return res.status(429).json({
      error: `Daily view limit of ${campaign.dailyLimit} reached for this campaign.`
    });
  }
  const now = Date.now();
  if (now - userRecord.lastViewTime < 8e3) {
    return res.status(429).json({ error: "Please wait before claiming the next ad reward." });
  }
  userRecord.count += 1;
  userRecord.lastViewTime = now;
  userAdViewsDaily[`${userId}_${campaignId}`] = userRecord;
  const wallet = getOrCreateWallet(userId);
  wallet.balance += campaign.rewardBdt;
  wallet.totalEarned += campaign.rewardBdt;
  wallet.videoAdEarnings += campaign.rewardBdt;
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: "video_ad_reward",
    amount: campaign.rewardBdt,
    balanceAfter: wallet.balance,
    description: `Earned \u09F3${campaign.rewardBdt.toFixed(2)} for viewing ${campaign.title}`,
    referenceId: campaign.id,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  walletTransactions.unshift(tx);
  res.json({
    success: true,
    rewardBdt: campaign.rewardBdt,
    remainingToday: campaign.dailyLimit - userRecord.count,
    balance: wallet.balance,
    transaction: tx
  });
});
app.get("/api/wallet/:userId", (req, res) => {
  const { userId } = req.params;
  const wallet = getOrCreateWallet(userId);
  const txs = walletTransactions.filter((t) => t.userId === userId).slice(0, 50);
  const withdrawals = withdrawalRequests.filter((w) => w.userId === userId);
  res.json({ wallet, transactions: txs, withdrawals });
});
app.post("/api/withdrawals/request", (req, res) => {
  const { userId, userEmail, userName, method, accountNumber, amountBdt } = req.body;
  if (!userId || !method || !accountNumber || !amountBdt) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!["bKash", "Nagad", "Rocket"].includes(method)) {
    return res.status(400).json({ error: "Invalid payment method. Supported: bKash, Nagad, Rocket." });
  }
  const cleanPhone = accountNumber.replace(/[\s-]/g, "");
  if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
    return res.status(400).json({
      error: "Invalid recipient number. Must be a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX)."
    });
  }
  const amount = Number(amountBdt);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid withdrawal amount." });
  }
  if (amount < appSettings.minWithdrawalBdt) {
    return res.status(400).json({
      error: `Minimum withdrawal amount is \u09F3${appSettings.minWithdrawalBdt}.`
    });
  }
  if (amount > appSettings.maxWithdrawalBdt) {
    return res.status(400).json({
      error: `Maximum withdrawal amount is \u09F3${appSettings.maxWithdrawalBdt}.`
    });
  }
  const wallet = getOrCreateWallet(userId);
  if (wallet.balance < amount) {
    return res.status(400).json({
      error: `Insufficient available balance. You have \u09F3${wallet.balance.toFixed(2)}.`
    });
  }
  const feeBdt = Number((amount * appSettings.withdrawalFeePercent / 100).toFixed(2));
  const finalPayableBdt = Number((amount - feeBdt).toFixed(2));
  wallet.balance -= amount;
  wallet.pendingWithdrawal += amount;
  const reqId = `wdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const withdrawalRecord = {
    id: reqId,
    userId,
    userEmail: userEmail || "user@bdtearnpro.com",
    userName: userName || "Member",
    method,
    accountNumber: cleanPhone,
    amountBdt: amount,
    feeBdt,
    finalPayableBdt,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  withdrawalRequests.unshift(withdrawalRecord);
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: "withdrawal_hold",
    amount: -amount,
    balanceAfter: wallet.balance,
    description: `Withdrawal request of \u09F3${amount.toFixed(2)} via ${method} (${cleanPhone}) held for processing`,
    referenceId: reqId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  walletTransactions.unshift(tx);
  res.json({
    success: true,
    withdrawal: withdrawalRecord,
    balance: wallet.balance,
    pendingWithdrawal: wallet.pendingWithdrawal
  });
});
app.post("/api/referrals/register", (req, res) => {
  const { userId, email, referralCode } = req.body;
  if (!userId || !referralCode) {
    return res.status(400).json({ error: "Missing parameters." });
  }
  const refRecord = {
    id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    referrerId: referralCode,
    // Referrer identifier
    referredUserId: userId,
    referredEmail: email,
    commissionBdt: appSettings.referralCommissionBdt,
    status: "qualified",
    // Automatically qualify in demo or on first task
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  referralsList.unshift(refRecord);
  res.json({ success: true });
});
app.get("/api/referrals/stats/:userId", (req, res) => {
  const { userId } = req.params;
  const list = referralsList.filter((r) => r.referrerId === userId || r.referrerId.includes("BDT"));
  res.json({
    totalInvited: list.length,
    eligible: list.filter((r) => r.status === "qualified" || r.status === "paid").length,
    commissionBdt: appSettings.referralCommissionBdt,
    history: list.slice(0, 20)
  });
});
app.get("/api/admin/overview", requireAdmin, (req, res) => {
  const totalUsers = Object.keys(serverWallets).length + 35;
  const activeUsers = Math.max(12, Math.floor(totalUsers * 0.75));
  let totalRewardsCredited = 0;
  walletTransactions.forEach((tx) => {
    if (tx.amount > 0) totalRewardsCredited += tx.amount;
  });
  const pendingWdCount = withdrawalRequests.filter((w) => w.status === "pending").length;
  const paidWdTotal = withdrawalRequests.filter((w) => w.status === "paid").reduce((sum, w) => sum + w.finalPayableBdt, 0);
  res.json({
    kpis: {
      totalUsers,
      activeUsers,
      totalCompletedTasks: tasksCatalog.reduce((sum, t) => sum + t.currentCompletions, 0),
      totalRewardsCredited: totalRewardsCredited + 1250,
      pendingWithdrawalsCount: pendingWdCount,
      paidWithdrawalsTotal: paidWdTotal + 4820,
      totalReferralCommissions: referralsList.length * appSettings.referralCommissionBdt
    },
    recentTransactions: walletTransactions.slice(0, 10),
    recentWithdrawals: withdrawalRequests.slice(0, 10)
  });
});
app.post("/api/users/sync", (req, res) => {
  const { userId, email, displayName } = req.body;
  if (userId) {
    if (!serverRegisteredUsers[userId]) {
      serverRegisteredUsers[userId] = {
        id: userId,
        email: email || `${userId.substring(0, 8)}@gmail.com`,
        displayName: displayName || "Member",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: userStatusMap[userId] || "active"
      };
    } else {
      if (email) serverRegisteredUsers[userId].email = email;
      if (displayName) serverRegisteredUsers[userId].displayName = displayName;
    }
    const wallet = getOrCreateWallet(userId);
    return res.json({ success: true, wallet, status: userStatusMap[userId] || "active" });
  }
  res.status(400).json({ error: "Missing userId" });
});
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const userIds = /* @__PURE__ */ new Set([
    ...Object.keys(serverRegisteredUsers),
    ...Object.keys(serverWallets)
  ]);
  if (userIds.size === 0) {
    const defaultDemos = [
      { id: "usr_demo_1", name: "Karim Ahmed", email: "karim.ahmed@gmail.com", bal: 320, pend: 100, earn: 450, task: 210, ref: 80, vid: 80, spin: 80 },
      { id: "usr_demo_2", name: "Sumaiya Akter", email: "sumaiya.akter@gmail.com", bal: 85.5, pend: 0, earn: 185.5, task: 120.5, ref: 30, vid: 20, spin: 15 },
      { id: "usr_demo_3", name: "Rafiqul Islam", email: "rafiqul.islam@gmail.com", bal: 150, pend: 50, earn: 290, task: 160, ref: 50, vid: 40, spin: 40 },
      { id: "usr_demo_4", name: "Tania Sultana", email: "tania.sultana@gmail.com", bal: 540, pend: 0, earn: 680, task: 340, ref: 120, vid: 110, spin: 110 }
    ];
    defaultDemos.forEach((d) => {
      serverRegisteredUsers[d.id] = {
        id: d.id,
        email: d.email,
        displayName: d.name,
        createdAt: new Date(Date.now() - 864e5 * 2).toISOString(),
        status: "active"
      };
      serverWallets[d.id] = {
        userId: d.id,
        balance: d.bal,
        pendingWithdrawal: d.pend,
        totalEarned: d.earn,
        totalWithdrawn: d.earn - d.bal - d.pend,
        taskEarnings: d.task,
        referralEarnings: d.ref,
        videoAdEarnings: d.vid,
        spinEarnings: d.spin
      };
      userIds.add(d.id);
    });
  }
  const users = Array.from(userIds).map((uid) => {
    const reg = serverRegisteredUsers[uid];
    const w = getOrCreateWallet(uid);
    const status = userStatusMap[uid] || reg?.status || "active";
    const points = userPointsMap[uid] !== void 0 ? userPointsMap[uid] : Math.round(w.balance * 10);
    return {
      id: uid,
      email: reg?.email || `${uid.substring(0, 8)}@user.com`,
      displayName: reg?.displayName || `User ${uid.substring(0, 5)}`,
      status,
      points,
      createdAt: reg?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      wallet: w
    };
  });
  res.json({ users });
});
app.post("/api/admin/users/status", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { userId, status } = req.body;
  if (!userId || !status) {
    return res.status(400).json({ error: "userId and status are required." });
  }
  userStatusMap[userId] = status;
  if (serverRegisteredUsers[userId]) {
    serverRegisteredUsers[userId].status = status;
  }
  logAdminAction(adminUser.username, "UPDATE_USER_STATUS", `Set user ${userId} status to ${status}`, req, userId);
  res.json({ success: true, userId, status });
});
app.post("/api/admin/adjust-balance", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { userId, targetField = "balance", operation = "add", amountBdt, reason } = req.body;
  if (!userId || amountBdt === void 0 || !reason) {
    return res.status(400).json({ error: "UserId, adjustment amount, and reason are required." });
  }
  const amount = Number(amountBdt);
  if (isNaN(amount) || amount === 0) {
    return res.status(400).json({ error: "Valid non-zero adjustment amount is required." });
  }
  const wallet = getOrCreateWallet(userId);
  const currentPoints = userPointsMap[userId] !== void 0 ? userPointsMap[userId] : Math.round(wallet.balance * 10);
  let deltaBalance = 0;
  if (targetField === "points") {
    if (operation === "add") {
      userPointsMap[userId] = currentPoints + Math.round(amount);
    } else if (operation === "subtract") {
      userPointsMap[userId] = Math.max(0, currentPoints - Math.round(amount));
    } else {
      userPointsMap[userId] = Math.max(0, Math.round(amount));
    }
  } else if (targetField === "taskEarnings") {
    if (operation === "add") {
      wallet.taskEarnings += amount;
      wallet.balance += amount;
      wallet.totalEarned += amount;
      deltaBalance = amount;
    } else if (operation === "subtract") {
      wallet.taskEarnings = Math.max(0, wallet.taskEarnings - amount);
      wallet.balance = Math.max(0, wallet.balance - amount);
      deltaBalance = -amount;
    } else {
      wallet.taskEarnings = Math.max(0, amount);
    }
  } else if (targetField === "videoAdEarnings") {
    if (operation === "add") {
      wallet.videoAdEarnings += amount;
      wallet.balance += amount;
      wallet.totalEarned += amount;
      deltaBalance = amount;
    } else if (operation === "subtract") {
      wallet.videoAdEarnings = Math.max(0, wallet.videoAdEarnings - amount);
      wallet.balance = Math.max(0, wallet.balance - amount);
      deltaBalance = -amount;
    } else {
      wallet.videoAdEarnings = Math.max(0, amount);
    }
  } else if (targetField === "referralEarnings") {
    if (operation === "add") {
      wallet.referralEarnings += amount;
      wallet.balance += amount;
      wallet.totalEarned += amount;
      deltaBalance = amount;
    } else if (operation === "subtract") {
      wallet.referralEarnings = Math.max(0, wallet.referralEarnings - amount);
      wallet.balance = Math.max(0, wallet.balance - amount);
      deltaBalance = -amount;
    } else {
      wallet.referralEarnings = Math.max(0, amount);
    }
  } else if (targetField === "spinEarnings") {
    if (operation === "add") {
      wallet.spinEarnings += amount;
      wallet.balance += amount;
      wallet.totalEarned += amount;
      deltaBalance = amount;
    } else if (operation === "subtract") {
      wallet.spinEarnings = Math.max(0, wallet.spinEarnings - amount);
      wallet.balance = Math.max(0, wallet.balance - amount);
      deltaBalance = -amount;
    } else {
      wallet.spinEarnings = Math.max(0, amount);
    }
  } else {
    if (operation === "add") {
      wallet.balance += amount;
      wallet.totalEarned += amount;
      deltaBalance = amount;
    } else if (operation === "subtract") {
      wallet.balance = Math.max(0, wallet.balance - amount);
      deltaBalance = -amount;
    } else {
      wallet.balance = Math.max(0, amount);
      deltaBalance = amount - wallet.balance;
    }
  }
  if (targetField !== "points") {
    userPointsMap[userId] = Math.round(wallet.balance * 10);
  }
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: "admin_adjustment",
    amount: deltaBalance !== 0 ? deltaBalance : amount,
    balanceAfter: wallet.balance,
    description: `Admin adjustment (${targetField} ${operation} ${amount}): ${reason} (by ${adminUser.username})`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  walletTransactions.unshift(tx);
  logAdminAction(
    adminUser.username,
    "MANUAL_BALANCE_ADJUSTMENT",
    `Adjusted user ${userId} [${targetField}] (${operation} ${amount}). Reason: ${reason}`,
    req,
    userId
  );
  res.json({
    success: true,
    wallet,
    points: userPointsMap[userId],
    balance: wallet.balance,
    transaction: tx
  });
});
app.get("/api/admin/withdrawals", requireAdmin, (req, res) => {
  if (withdrawalRequests.length === 0) {
    withdrawalRequests.push(
      {
        id: "wdr_init_1",
        userId: "usr_demo_1",
        userEmail: "karim.ahmed@gmail.com",
        userName: "Karim Ahmed",
        method: "bKash",
        accountNumber: "01712345678",
        amountBdt: 200,
        feeBdt: 3,
        finalPayableBdt: 197,
        status: "pending",
        createdAt: new Date(Date.now() - 36e5).toISOString()
      },
      {
        id: "wdr_init_2",
        userId: "usr_demo_2",
        userEmail: "sumaiya.akter@gmail.com",
        userName: "Sumaiya Akter",
        method: "Nagad",
        accountNumber: "01898765432",
        amountBdt: 150,
        feeBdt: 2.25,
        finalPayableBdt: 147.75,
        status: "pending",
        createdAt: new Date(Date.now() - 72e5).toISOString()
      }
    );
  }
  res.json({ withdrawals: withdrawalRequests });
});
app.post("/api/admin/withdrawals/action", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { withdrawalId, action, transactionReference, rejectReason } = req.body;
  const wd = withdrawalRequests.find((w) => w.id === withdrawalId);
  if (!wd) {
    return res.status(404).json({ error: "Withdrawal request not found." });
  }
  if (action === "approve") {
    wd.status = "approved";
    wd.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    logAdminAction(adminUser.username, "APPROVE_WITHDRAWAL", `Approved withdrawal ${withdrawalId}`, req, wd.userId);
  } else if (action === "paid") {
    if (!transactionReference) {
      return res.status(400).json({ error: "Transaction TrxID reference is required to mark as paid." });
    }
    wd.status = "paid";
    wd.transactionReference = transactionReference;
    wd.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const wallet = getOrCreateWallet(wd.userId);
    wallet.pendingWithdrawal = Math.max(0, wallet.pendingWithdrawal - wd.amountBdt);
    wallet.totalWithdrawn += wd.finalPayableBdt;
    logAdminAction(
      adminUser.username,
      "PAY_WITHDRAWAL",
      `Marked withdrawal ${withdrawalId} as paid with TrxID: ${transactionReference}`,
      req,
      wd.userId
    );
  } else if (action === "reject") {
    if (wd.status === "rejected") {
      return res.status(400).json({ error: "Withdrawal already rejected and refunded." });
    }
    wd.status = "rejected";
    wd.adminNote = rejectReason || "Declined by administrator";
    wd.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const wallet = getOrCreateWallet(wd.userId);
    wallet.pendingWithdrawal = Math.max(0, wallet.pendingWithdrawal - wd.amountBdt);
    wallet.balance += wd.amountBdt;
    const refundTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: wd.userId,
      type: "withdrawal_refund",
      amount: wd.amountBdt,
      balanceAfter: wallet.balance,
      description: `Refund of rejected withdrawal (${wd.method} \u09F3${wd.amountBdt}). Reason: ${wd.adminNote}`,
      referenceId: wd.id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    walletTransactions.unshift(refundTx);
    logAdminAction(
      adminUser.username,
      "REJECT_WITHDRAWAL",
      `Rejected withdrawal ${withdrawalId} and refunded \u09F3${wd.amountBdt} back to user balance.`,
      req,
      wd.userId
    );
  }
  res.json({ success: true, withdrawal: wd });
});
app.post("/api/admin/tasks/save", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const taskData = req.body;
  if (!taskData.title || !taskData.rewardBdt) {
    return res.status(400).json({ error: "Title and reward amount are required." });
  }
  if (taskData.id) {
    const idx = tasksCatalog.findIndex((t) => t.id === taskData.id);
    if (idx !== -1) {
      tasksCatalog[idx] = {
        ...tasksCatalog[idx],
        ...taskData,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      logAdminAction(adminUser.username, "UPDATE_TASK", `Updated task: ${taskData.title}`, req, taskData.id);
      return res.json({ success: true, task: tasksCatalog[idx] });
    }
  }
  const newTask = {
    ...taskData,
    id: `task_${Date.now()}`,
    currentCompletions: 0,
    status: taskData.status || "active",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  tasksCatalog.unshift(newTask);
  logAdminAction(adminUser.username, "CREATE_TASK", `Created task: ${newTask.title}`, req, newTask.id);
  res.json({ success: true, task: newTask });
});
app.delete("/api/admin/tasks/:taskId", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { taskId } = req.params;
  tasksCatalog = tasksCatalog.filter((t) => t.id !== taskId);
  logAdminAction(adminUser.username, "DELETE_TASK", `Deleted task ID: ${taskId}`, req, taskId);
  res.json({ success: true });
});
app.post("/api/admin/ad-settings/save", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { adSettings } = req.body;
  if (adSettings) {
    globalAdSettings = {
      ...globalAdSettings,
      ...adSettings
    };
    logAdminAction(
      adminUser.username,
      "UPDATE_AD_SETTINGS",
      `Updated Adsterra Smart Link, Monetag Direct Link, and YouTube Video Link.`,
      req
    );
  }
  res.json({ success: true, adSettings: globalAdSettings });
});
app.post("/api/admin/payout-settings/save", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { newPayoutSettings } = req.body;
  if (newPayoutSettings) {
    payoutSettings = {
      ...payoutSettings,
      ...newPayoutSettings
    };
    if (newPayoutSettings.referralCommissionBdt !== void 0) {
      appSettings.referralCommissionBdt = Number(newPayoutSettings.referralCommissionBdt);
    }
    if (newPayoutSettings.dailySpinLimit !== void 0) {
      spinSettings.dailyLimit = Number(newPayoutSettings.dailySpinLimit);
    }
    if (newPayoutSettings.watchAndEarnRewardBdt !== void 0) {
      adCampaigns.forEach((c) => {
        if (c.format === "rewarded_video") {
          c.rewardBdt = Number(newPayoutSettings.watchAndEarnRewardBdt);
        }
      });
    }
    logAdminAction(
      adminUser.username,
      "UPDATE_PAYOUT_SETTINGS",
      `Updated reward payout amounts for tasks, watch & earn, and referrals.`,
      req
    );
  }
  res.json({ success: true, payoutSettings });
});
app.post("/api/admin/ads/save", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { campaigns } = req.body;
  if (Array.isArray(campaigns)) {
    adCampaigns = campaigns;
    logAdminAction(adminUser.username, "UPDATE_AD_CAMPAIGNS", "Updated advertising placements config.", req);
  }
  res.json({ success: true, campaigns: adCampaigns });
});
app.post("/api/admin/settings/save", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { newSettings } = req.body;
  if (newSettings) {
    appSettings = { ...appSettings, ...newSettings };
    logAdminAction(adminUser.username, "UPDATE_APP_SETTINGS", "Updated application parameters.", req);
  }
  res.json({ success: true, appSettings });
});
app.post("/api/admin/spin-settings/save", requireAdmin, (req, res) => {
  const adminUser = req.adminUser;
  const { newSpinSettings } = req.body;
  if (newSpinSettings) {
    spinSettings = { ...spinSettings, ...newSpinSettings };
    logAdminAction(adminUser.username, "UPDATE_SPIN_SETTINGS", "Updated lucky wheel configuration.", req);
  }
  res.json({ success: true, spinSettings });
});
app.get("/api/admin/activity-logs", requireAdmin, (req, res) => {
  res.json({ logs: activityLogs });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      try {
        let template = import_fs.default.readFileSync(import_path.default.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = import_path.default.resolve(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
var isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.IS_SERVERLESS);
if (!isServerless && process.env.NODE_ENV !== "test") {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
