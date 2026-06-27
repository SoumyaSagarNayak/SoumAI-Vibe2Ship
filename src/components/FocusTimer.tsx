import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, CheckCircle2, Timer } from 'lucide-react';
import { api } from '../services/api';
import type { PomodoroSession } from '../services/api';

interface FocusTimerProps {
  /** Optional pre-built Pomodoro sessions from the API */
  sessions?: PomodoroSession[];
  /** Callback when a session is recorded */
  onSessionComplete?: (durationMinutes: number) => void;
}

type TimerPhase = 'idle' | 'work' | 'break' | 'done';

const WORK_SECONDS = 50 * 60;   // 50 minutes
const BREAK_SECONDS = 10 * 60;  // 10 minutes

/** Formats seconds into MM:SS display string */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusTimer({ sessions = [], onSessionComplete }: FocusTimerProps) {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionIdx, setCurrentSessionIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Core countdown logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            // Advance phase
            if (phase === 'work') {
              setPhase('break');
              setSecondsLeft(BREAK_SECONDS);
              setIsRunning(true);
              // Record completed work session
              const newCount = completedCount + 1;
              setCompletedCount(newCount);
              api.completeFocusSession(50).catch(() => {});
              if (onSessionComplete) onSessionComplete(50);
            } else if (phase === 'break') {
              const nextIdx = currentSessionIdx + 1;
              if (nextIdx < sessions.length) {
                setCurrentSessionIdx(nextIdx);
                setPhase('work');
                setSecondsLeft(WORK_SECONDS);
                setIsRunning(true);
              } else {
                setPhase('done');
                setIsRunning(false);
              }
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase]);

  const handleStart = () => {
    setPhase('work');
    setSecondsLeft(WORK_SECONDS);
    setIsRunning(true);
    setCurrentSessionIdx(0);
    setCompletedCount(0);
  };

  const handlePause = () => setIsRunning(false);
  const handleResume = () => setIsRunning(true);

  const handleStop = () => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(WORK_SECONDS);
    setCurrentSessionIdx(0);
  };

  const currentSession = sessions[currentSessionIdx];
  const progressPercent = phase === 'work'
    ? ((WORK_SECONDS - secondsLeft) / WORK_SECONDS) * 100
    : phase === 'break'
    ? ((BREAK_SECONDS - secondsLeft) / BREAK_SECONDS) * 100
    : 0;

  return (
    <div className="glass-panel p-6 border-hairline space-y-5 relative">
      <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-3">
        <h3 className="text-muted text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 pt-1">
          <Timer className="w-4 h-4 text-ink" />
          Focus Timer — Pomodoro Mode
        </h3>
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted">
          50 min work · 10 min break
        </span>
      </div>

      {/* Current session activity */}
      {currentSession && phase !== 'idle' && phase !== 'done' && (
        <div className="p-3 bg-surface-soft border border-hairline">
          <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Current Task</span>
          <span className="text-sm font-bold text-ink mt-1 block">{currentSession.activity}</span>
          <span className="text-[10px] text-muted">{currentSession.timeSlot}</span>
        </div>
      )}

      {/* Timer display */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative w-40 h-40">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="62" fill="none" stroke="var(--color-surface-soft, #1a1a1a)" strokeWidth="6" />
            <circle
              cx="70" cy="70" r="62"
              fill="none"
              stroke={phase === 'break' ? '#22c55e' : phase === 'done' ? '#22c55e' : 'white'}
              strokeWidth="6"
              strokeLinecap="square"
              strokeDasharray={2 * Math.PI * 62}
              strokeDashoffset={2 * Math.PI * 62 * (1 - progressPercent / 100)}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-ink tabular-nums">
              {phase === 'done' ? '✓' : formatTime(secondsLeft)}
            </span>
            <span className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
              {phase === 'idle' ? 'Ready' : phase === 'work' ? 'Focus' : phase === 'break' ? 'Break' : 'Done!'}
            </span>
          </div>
        </div>

        {/* Sessions counter */}
        <div className="text-center">
          <span className="text-[9px] text-muted font-bold uppercase tracking-wider">Sessions Completed Today</span>
          <p className="text-2xl font-bold text-ink mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-2 border-t border-hairline">
        {phase === 'idle' || phase === 'done' ? (
          <button
            onClick={handleStart}
            className="bmw-btn-primary px-6 py-2.5 text-[10px] flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            {phase === 'done' ? 'Start New Session' : 'Start Session'}
          </button>
        ) : (
          <>
            {isRunning ? (
              <button
                onClick={handlePause}
                className="bmw-btn-secondary px-5 py-2.5 text-[10px] flex items-center gap-2"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="bmw-btn-primary px-5 py-2.5 text-[10px] flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                Resume
              </button>
            )}
            <button
              onClick={handleStop}
              className="px-5 py-2.5 text-[10px] border border-hairline text-ink bg-canvas hover:bg-surface-soft transition-colors font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          </>
        )}
      </div>

      {/* Done state */}
      {phase === 'done' && (
        <div className="flex items-center gap-2 p-3 border border-success/30 bg-success/5">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-xs font-bold text-success uppercase tracking-wider">
            All sessions complete! Great focus work today.
          </span>
        </div>
      )}
    </div>
  );
}
