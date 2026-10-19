import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../components/Toast';
import { AdModal } from '../components/AdModal';
import { fireRewardConfetti } from '../lib/confetti';
import { TaskItem } from '../types';
import {
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Play,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { currentUser, refreshWallet } = useAuth();
  const { t, formatBDT } = useThemeLanguage();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Active Session state
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    task: TaskItem;
    adRequired: boolean;
    adCountdownSeconds: number;
    sponsorUrl: string;
  } | null>(null);

  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // Task Countdown state after ad completion
  const [unlockedTaskSession, setUnlockedTaskSession] = useState<{
    sessionId: string;
    task: TaskItem;
    taskStartedAt: number;
    durationSeconds: number;
    secondsRemaining: number;
  } | null>(null);

  const [submissionNote, setSubmissionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error('Fetch tasks error:', e);
    } finally {
      setLoading(false);
    }
  };

  // 1. User clicks "Start Task"
  const handleStartTask = async (task: TaskItem) => {
    if (!currentUser) {
      showToast('Please login to start earning rewards from tasks.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/tasks/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, userId: currentUser.uid }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Unable to start task.', 'error');
        return;
      }

      const sessionObj = {
        sessionId: data.sessionId,
        task,
        adRequired: data.adRequired,
        adCountdownSeconds: data.adCountdownSeconds || 10,
        sponsorUrl: data.sponsorUrl || 'https://monetag.com',
      };

      setActiveSession(sessionObj);
      setCompletedSuccess(false);
      setSubmissionNote('');

      // Open the Ad countdown modal if adRequired is true
      if (data.adRequired) {
        setIsAdModalOpen(true);
      } else {
        // Direct unlock if no ad required
        setUnlockedTaskSession({
          sessionId: data.sessionId,
          task,
          taskStartedAt: Date.now(),
          durationSeconds: data.durationSeconds,
          secondsRemaining: data.durationSeconds,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  // 2. Ad session completed callback
  const handleAdVerified = (taskStartedAt: number, durationSeconds: number) => {
    setIsAdModalOpen(false);
    if (!activeSession) return;

    showToast(t('adCompletedUnlocked'), 'success');

    setUnlockedTaskSession({
      sessionId: activeSession.sessionId,
      task: activeSession.task,
      taskStartedAt,
      durationSeconds,
      secondsRemaining: durationSeconds,
    });
  };

  // 3. Task timer interval
  useEffect(() => {
    if (!unlockedTaskSession) return;

    const interval = setInterval(() => {
      setUnlockedTaskSession((prev) => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          clearInterval(interval);
          return { ...prev, secondsRemaining: 0 };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockedTaskSession?.sessionId]);

  // 4. Submit Task
  const handleSubmitTask = async () => {
    if (!unlockedTaskSession || !currentUser) return;

    if (unlockedTaskSession.secondsRemaining > 0) {
      showToast(`Please wait ${unlockedTaskSession.secondsRemaining}s before submitting.`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: unlockedTaskSession.sessionId,
          userId: currentUser.uid,
          submissionNote: submissionNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Submission verification failed.', 'error');
        setSubmitting(false);
        return;
      }

      setCompletedSuccess(true);
      fireRewardConfetti();
      showToast(`Earned ৳${data.rewardBdt.toFixed(2)} credited to your wallet!`, 'success');
      await refreshWallet();
    } catch (e: any) {
      showToast(e.message || 'Submission error.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['All', 'Video & Social', 'Website Visit', 'Survey', 'Daily Bonus'];
  const filteredTasks =
    selectedCategory === 'All'
      ? tasks
      : tasks.filter((t) => t.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Timer Tasks
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{t('tasksTitle')}</h1>
          <p className="text-xs sm:text-sm text-emerald-100">{t('tasksSubtitle')}</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Unlocked Task Countdown Screen */}
      {unlockedTaskSession && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase">
                Task Unlocked & In Progress
              </span>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                {unlockedTaskSession.task.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-gray-400 font-medium">Task Reward</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatBDT(unlockedTaskSession.task.rewardBdt)}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {t('taskInstructions')}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {unlockedTaskSession.task.instructions}
            </p>
            {unlockedTaskSession.task.targetUrl && (
              <a
                href={unlockedTaskSession.task.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open Task Link <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Real-time verified countdown timer */}
          {!completedSuccess ? (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-700 text-center space-y-3">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-2xl text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-lg">
                {unlockedTaskSession.secondsRemaining}s
              </div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {unlockedTaskSession.secondsRemaining > 0
                  ? t('taskTimerRemaining') + ` ${unlockedTaskSession.secondsRemaining} seconds`
                  : 'Time requirement satisfied! You can now submit this task.'}
              </div>

              {/* Submission field */}
              <div className="w-full max-w-md pt-2">
                <input
                  type="text"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder={t('taskProofPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSubmitTask}
                  disabled={unlockedTaskSession.secondsRemaining > 0 || submitting}
                  className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${
                    unlockedTaskSession.secondsRemaining > 0 || submitting
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? t('loading') : t('submitTask')}</span>
                </button>
                <button
                  onClick={() => setUnlockedTaskSession(null)}
                  className="px-4 py-3 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Exit Task
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200">
                {t('taskCompletedSuccess')}
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Reward of {formatBDT(unlockedTaskSession.task.rewardBdt)} added to your available balance.
              </p>
              <button
                onClick={() => setUnlockedTaskSession(null)}
                className="mt-2 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Back to Available Tasks
              </button>
            </div>
          )}
        </div>
      )}

      {/* Task List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Category & Status */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase">
                  {task.category}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {task.currentCompletions} Completed
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                {task.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{task.timerDurationSeconds}s timer</span>
                </div>
                {task.adRequired && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>10s Ad Required</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Reward and Action */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Reward</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatBDT(task.rewardBdt)}
                </div>
              </div>

              <button
                onClick={() => handleStartTask(task)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t('startTask')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sponsored Ad Countdown Modal */}
      {activeSession && (
        <AdModal
          isOpen={isAdModalOpen}
          onClose={() => {
            setIsAdModalOpen(false);
            setActiveSession(null);
            showToast(t('taskCancelled'), 'info');
          }}
          sessionId={activeSession.sessionId}
          userId={currentUser?.uid || ''}
          sponsorUrl={activeSession.sponsorUrl}
          adCountdownSeconds={activeSession.adCountdownSeconds}
          onAdVerified={handleAdVerified}
        />
      )}
    </div>
  );
};
