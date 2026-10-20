import React, { useRef, useState, useEffect } from 'react';
import { SpinSegment } from '../types';
import { fireBigWinConfetti } from '../lib/confetti';
import { Sparkles, Award } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface SpinWheelProps {
  segments: SpinSegment[];
  onSpinEnd: (wonSegment: SpinSegment, balance: number) => void;
  userId: string;
  spinsRemaining: number;
  disabled?: boolean;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({
  segments,
  onSpinEnd,
  userId,
  spinsRemaining,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [wonResult, setWonResult] = useState<SpinSegment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numSegments = segments.length || 7;
  const segmentAngle = (2 * Math.PI) / numSegments;

  // Render Wheel Canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;

    ctx.clearRect(0, 0, width, height);

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Draw slices
    for (let i = 0; i < numSegments; i++) {
      const seg = segments[i];
      const startAngle = i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = seg.color || '#3B82F6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = seg.textColor || '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, radius - 20, 0);
      ctx.restore();
    }

    ctx.restore();

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WIN', centerX, centerY);
  };

  useEffect(() => {
    drawWheel(rotationAngle);
  }, [segments, rotationAngle]);

  const handleSpinClick = async () => {
    if (spinning || disabled || spinsRemaining <= 0) return;
    setErrorMsg(null);
    setWonResult(null);
    setSpinning(true);

    try {
      // 1. Authoritative backend RNG determination!
      const res = await apiFetch('/api/spin/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error || 'Failed to spin.');
        setSpinning(false);
        return;
      }

      const { segmentIndex, wonSegment, balance } = res.data;

      // 2. Compute target stop angle
      // The pointer is at 12 o'clock (angle 3*PI/2)
      // To bring segmentIndex under the top pointer:
      const startAngle = rotationAngle % (2 * Math.PI);
      const targetSegmentAngle = segmentIndex * segmentAngle + segmentAngle / 2;
      let targetAngle = (3 * Math.PI) / 2 - targetSegmentAngle;
      while (targetAngle <= startAngle + 6 * Math.PI) {
        targetAngle += 2 * Math.PI;
      }

      const duration = 4000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic easing
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentAngle = startAngle + (targetAngle - startAngle) * ease;

        drawWheel(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setRotationAngle(targetAngle % (2 * Math.PI));
          setSpinning(false);
          setWonResult(wonSegment);
          fireBigWinConfetti();
          onSpinEnd(wonSegment, balance);
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while spinning.');
      setSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Pointer */}
      <div className="relative flex flex-col items-center">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500 z-20 drop-shadow-md -mb-3" />

        {/* Canvas Wheel */}
        <div className="relative p-2 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 shadow-2xl">
          <div className="rounded-full bg-slate-900 p-2">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="rounded-full max-w-full drop-shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* Control Button */}
      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={handleSpinClick}
          disabled={spinning || disabled || spinsRemaining <= 0}
          className={`px-8 py-3.5 rounded-full font-bold text-lg shadow-xl tracking-wide flex items-center gap-2 transition-all transform active:scale-95 ${
            spinning || disabled || spinsRemaining <= 0
              ? 'bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/30 hover:shadow-amber-500/50 scale-100 hover:scale-105'
          }`}
        >
          <Sparkles className="w-5 h-5 animate-spin" />
          {spinning ? 'SPINNING...' : spinsRemaining <= 0 ? 'LIMIT REACHED' : 'SPIN NOW'}
        </button>

        <div className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">
          Spins Remaining Today: <span className="font-bold text-emerald-600 dark:text-emerald-400">{spinsRemaining}</span>
        </div>
      </div>

      {/* Won Modal / Banner */}
      {wonResult && (
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 text-center animate-bounce">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Award className="w-4 h-4" />
            CONGRATULATIONS!
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
            You Won {wonResult.label}!
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            The reward has been credited directly to your BDT wallet.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm text-center">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
