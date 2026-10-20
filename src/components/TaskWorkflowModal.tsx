import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  ShieldCheck,
  Award,
  Video,
  ArrowRight,
} from 'lucide-react';
import { fireRewardConfetti, fireBigWinConfetti } from '../lib/confetti';
import { TaskItem } from '../types';
import { apiFetch } from '../lib/api';

interface TaskWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  task: TaskItem;
  userId: string;
  adProvider?: 'adsterra' | 'monetag';
  adUrl?: string;
  youtubeUrl?: string;
  durationSeconds?: number;
  rewardBdt?: number;
  adCountdownSeconds?: number;
  onClaimSuccess: (rewardBdt: number, newBalance: number) => void;
}

export const TaskWorkflowModal: React.FC<TaskWorkflowModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  task,
  userId,
  adProvider = 'adsterra',
  adUrl = 'https://www.highcpmgate.com/sample-smartlink',
  youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  durationSeconds = 25,
  rewardBdt = 5.0,
  adCountdownSeconds = 10,
  onClaimSuccess,
}) => {
  // 3-step state: 'ad' -> 'video' -> 'claim' -> 'completed'
  const [currentStep, setCurrentStep] = useState<'ad' | 'video' | 'claim' | 'completed'>('ad');
  
  // Step 1: Ad countdown state
  const [adSecondsLeft, setAdSecondsLeft] = useState(adCountdownSeconds);
  const [adClicked, setAdClicked] = useState(false);
  const [adVerifying, setAdVerifying] = useState(false);

  // Step 2: Video state
  const [hasStartedVideo, setHasStartedVideo] = useState(false);
  const [videoSecondsLeft, setVideoSecondsLeft] = useState(durationSeconds);
  const [videoVerifying, setVideoVerifying] = useState(false);

  // Step 3: Claim state
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<number>(rewardBdt);
  const [claimedNewBalance, setClaimedNewBalance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const adTimerRef = useRef<any>(null);
  const videoTimerRef = useRef<any>(null);

  // Helper to extract clean YouTube embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = match && match[2].length === 11 ? match[2] : 'dQw4w9WgXcQ';
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0`;
  };

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('ad');
      setAdSecondsLeft(adCountdownSeconds);
      setAdClicked(false);
      setAdVerifying(false);
      setHasStartedVideo(false);
      setVideoSecondsLeft(durationSeconds);
      setVideoVerifying(false);
      setClaiming(false);
      setClaimedNewBalance(null);
      setErrorMessage(null);
    }
  }, [isOpen, sessionId, adCountdownSeconds, durationSeconds]);

  // Step 1: Sponsor Ad Timer (starts automatically upon opening)
  useEffect(() => {
    if (!isOpen || currentStep !== 'ad') return;

    adTimerRef.current = setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(adTimerRef.current);
          handleValidateAd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (adTimerRef.current) clearInterval(adTimerRef.current);
    };
  }, [isOpen, currentStep, sessionId]);

  // Validate Ad completion on server
  const handleValidateAd = async () => {
    setAdVerifying(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch('/api/tasks/validate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId }),
      });
      if (!res.ok) {
        setErrorMessage(res.error || 'Ad verification failed.');
        setAdVerifying(false);
        return;
      }
      // Move to Step 2: YouTube Video
      setCurrentStep('video');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setAdVerifying(false);
    }
  };

  // Step 2: User clicks "Watch Now"
  const handleStartWatchVideo = () => {
    setHasStartedVideo(true);
    setErrorMessage(null);

    // Also open YouTube in new tab if user wants direct view
    if (youtubeUrl) {
      window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Step 2 Video Countdown Timer
  useEffect(() => {
    if (currentStep !== 'video' || !hasStartedVideo) return;

    videoTimerRef.current = setInterval(() => {
      setVideoSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(videoTimerRef.current);
          handleValidateVideo();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    };
  }, [currentStep, hasStartedVideo, sessionId]);

  // Validate Video completion on server
  const handleValidateVideo = async () => {
    setVideoVerifying(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch('/api/tasks/validate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId }),
      });
      if (!res.ok) {
        setErrorMessage(res.error || 'Video verification failed.');
        setVideoVerifying(false);
        return;
      }
      // Move to Step 3: Claim Button!
      setCurrentStep('claim');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setVideoVerifying(false);
    }
  };

  // Step 3: User clicks "Claim" button
  const handleClaimReward = async () => {
    setClaiming(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch('/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId }),
      });

      if (!res.ok || !res.data) {
        setErrorMessage(res.error || 'Claiming reward failed.');
        setClaiming(false);
        return;
      }

      const data = res.data;
      setClaimedReward(data.rewardBdt || rewardBdt);
      setClaimedNewBalance(data.balance);
      setCurrentStep('completed');
      fireBigWinConfetti();
      onClaimSuccess(data.rewardBdt || rewardBdt, data.balance);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error claiming task reward.');
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Steps Bar */}
        <div className="p-5 pb-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ৳
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-1">
                  {task.title}
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Reward: ৳{rewardBdt.toFixed(2)} BDT
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={currentStep === 'completed' ? false : adVerifying || videoVerifying || claiming}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {/* Step 1 Pill */}
            <div
              className={`p-2 rounded-xl text-center transition-all ${
                currentStep === 'ad'
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : currentStep === 'video' || currentStep === 'claim' || currentStep === 'completed'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Step 1</div>
              <div className="text-xs truncate">1. Direct Ad</div>
            </div>

            {/* Step 2 Pill */}
            <div
              className={`p-2 rounded-xl text-center transition-all ${
                currentStep === 'video'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : currentStep === 'claim' || currentStep === 'completed'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Step 2</div>
              <div className="text-xs truncate">2. Watch Video</div>
            </div>

            {/* Step 3 Pill */}
            <div
              className={`p-2 rounded-xl text-center transition-all ${
                currentStep === 'claim' || currentStep === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold animate-pulse'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
              }`}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider">Step 3</div>
              <div className="text-xs truncate">3. Claim ৳</div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= STEP 1: SPONSOR DIRECT AD ================= */}
          {currentStep === 'ad' && (
            <div className="space-y-5 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-extrabold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                {adProvider === 'adsterra' ? 'Adsterra Smart Link Offer' : 'Monetag Direct Link Offer'}
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Viewing Sponsor Advertisement
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  Please view the direct sponsor advertisement for {adCountdownSeconds} seconds to unlock the assigned YouTube video.
                </p>
              </div>

              {/* Countdown Circular Ring / Badge */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-28 h-28 rounded-full border-4 border-amber-400 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/90 shadow-xl">
                  <div className="text-center">
                    <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                      {adSecondsLeft}s
                    </span>
                    <span className="block text-[10px] font-bold uppercase text-gray-400 mt-0.5">
                      remaining
                    </span>
                  </div>
                </div>

                <div className="w-full max-w-xs mt-4 bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{
                      width: `${((adCountdownSeconds - adSecondsLeft) / adCountdownSeconds) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sponsor Link Action */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div>
                  <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Verified Direct Sponsor
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-xs font-mono mt-0.5">
                    {adUrl}
                  </div>
                </div>

                <a
                  href={adUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setAdClicked(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Sponsor Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {adVerifying && (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Verifying ad completion with server...</span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: YOUTUBE VIDEO & "WATCH NOW" ================= */}
          {currentStep === 'video' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold uppercase">
                  <Video className="w-3.5 h-3.5" />
                  Step 2: Video Requirement
                </span>
                <h4 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Watch Assigned YouTube Video
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Click <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"Watch Now"</strong> to begin. Watch the video for {durationSeconds} seconds to unlock the Claim button.
                </p>
              </div>

              {!hasStartedVideo ? (
                /* Before clicking Watch Now */
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-700 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
                    <Play className="w-8 h-8 fill-current translate-x-0.5" />
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                      Featured Promotional Clip
                    </h5>
                    <p className="text-xs text-gray-500 mt-1">
                      Required duration: {durationSeconds} seconds • Reward: ৳{rewardBdt.toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={handleStartWatchVideo}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 mx-auto transform hover:scale-105 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Now</span>
                  </button>
                </div>
              ) : (
                /* After clicking Watch Now: Video Player & Active Timer */
                <div className="space-y-4">
                  {/* YouTube Embed Player */}
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-slate-700 bg-black">
                    <iframe
                      src={getEmbedUrl(youtubeUrl)}
                      title="Assigned YouTube Video"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* Video Watch Timer Bar */}
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {videoSecondsLeft}s
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900 dark:text-white">
                          {videoSecondsLeft > 0 ? 'Watching Video...' : 'Time Requirement Met!'}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {videoSecondsLeft > 0
                            ? `Please watch ${videoSecondsLeft}s more to unlock Claim.`
                            : 'Unlocking Claim button now...'}
                        </div>
                      </div>
                    </div>

                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {videoVerifying && (
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse text-center flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Verifying video watch completion...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: "CLAIM" BUTTON ================= */}
          {currentStep === 'claim' && (
            <div className="text-center py-4 space-y-5">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border-4 border-emerald-400 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl animate-bounce">
                <Award className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold uppercase">
                  All Steps Verified
                </span>
                <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  Claim Your ৳{rewardBdt.toFixed(2)} Reward!
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                  You have successfully watched the sponsor ad and video. Click the claim button below to add your reward to your balance.
                </p>
              </div>

              <button
                onClick={handleClaimReward}
                disabled={claiming}
                className={`w-full max-w-sm py-4 rounded-2xl font-black text-base shadow-2xl flex items-center justify-center gap-2 mx-auto transition-all transform hover:scale-105 active:scale-95 ${
                  claiming
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-wait'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-emerald-500/40 ring-4 ring-emerald-400/20'
                }`}
              >
                <Sparkles className="w-5 h-5 fill-current" />
                <span>{claiming ? 'Crediting Reward...' : `Claim ৳${rewardBdt.toFixed(2)} Now`}</span>
              </button>
            </div>
          )}

          {/* ================= STEP 4: COMPLETED CELEBRATION ================= */}
          {currentStep === 'completed' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-scaleUp">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  +৳{claimedReward.toFixed(2)} Credited!
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  The task reward has been automatically added directly to your account balance.
                </p>
                {claimedNewBalance !== null && (
                  <div className="mt-3 inline-block px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-800 dark:text-gray-200">
                    New Available Balance: ৳{claimedNewBalance.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Done & Continue Earning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
