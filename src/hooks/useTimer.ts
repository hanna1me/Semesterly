import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import type { PomodoroPhase, TimerMode } from '../types/session';

type UseTimerOptions = {
  mode: TimerMode;
  countdownTargetSeconds: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  onCountdownComplete?: () => void;
};

type StopResult = {
  elapsedSeconds: number;
  pomodoroCyclesCompleted: number;
};

export type UseTimerResult = {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  displayTime: string;
  pomodoroPhase: PomodoroPhase;
  pomodoroCyclesCompleted: number;
  startedAt: Date | null;
  accumulatedSeconds: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => StopResult;
  reset: () => void;
  addElapsedSeconds: (seconds: number) => void;
  sync: () => void;
};

export function useTimer({
  mode,
  countdownTargetSeconds,
  pomodoroWorkMinutes,
  pomodoroBreakMinutes,
  onCountdownComplete,
}: UseTimerOptions): UseTimerResult {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // startedAt + accumulatedSeconds are the wall-clock source of truth.
  // elapsedSeconds is total time since the session's first start() call,
  // unaffected by pomodoro phase transitions (it only resets on reset()/start()).
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // The total-elapsed value at the moment the current pomodoro phase began,
  // so phase-relative remaining time can be derived without resetting the
  // master clock (which would corrupt duration_seconds on save).
  const [phaseStartElapsedSeconds, setPhaseStartElapsedSeconds] = useState(0);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [pomodoroCyclesCompleted, setPomodoroCyclesCompleted] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const computeElapsed = useCallback(() => {
    if (!startedAt) return accumulatedSeconds;
    const secondsSinceStart = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    return accumulatedSeconds + secondsSinceStart;
  }, [startedAt, accumulatedSeconds]);

  const phaseTargetSeconds =
    mode === 'countdown'
      ? countdownTargetSeconds
      : mode === 'pomodoro'
        ? (pomodoroPhase === 'work' ? pomodoroWorkMinutes : pomodoroBreakMinutes) * 60
        : null;

  useEffect(() => {
    if (!isRunning || isPaused) {
      clearTick();
      return;
    }

    intervalRef.current = setInterval(() => {
      const total = computeElapsed();
      setElapsedSeconds(total);

      if (mode === 'countdown' && phaseTargetSeconds !== null && total >= phaseTargetSeconds) {
        clearTick();
        setIsRunning(false);
        onCountdownComplete?.();
        return;
      }

      if (mode === 'pomodoro' && phaseTargetSeconds !== null) {
        const phaseElapsed = total - phaseStartElapsedSeconds;
        if (phaseElapsed >= phaseTargetSeconds) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (pomodoroPhase === 'work') {
            setPomodoroCyclesCompleted((count) => count + 1);
          }
          setPomodoroPhase(pomodoroPhase === 'work' ? 'break' : 'work');
          setPhaseStartElapsedSeconds(total);
          // Note: if the app was backgrounded long enough to span more than
          // one full phase, this only advances a single phase per tick once
          // foregrounded - multi-cycle catch-up isn't handled.
        }
      }
    }, 1000);

    return clearTick;
  }, [
    isRunning,
    isPaused,
    computeElapsed,
    clearTick,
    mode,
    phaseTargetSeconds,
    phaseStartElapsedSeconds,
    pomodoroPhase,
    onCountdownComplete,
  ]);

  useEffect(() => clearTick, [clearTick]);

  const start = useCallback(() => {
    setStartedAt(new Date());
    setAccumulatedSeconds(0);
    setElapsedSeconds(0);
    setPhaseStartElapsedSeconds(0);
    setPomodoroPhase('work');
    setPomodoroCyclesCompleted(0);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    const current = computeElapsed();
    setAccumulatedSeconds(current);
    setElapsedSeconds(current);
    setStartedAt(null);
    setIsPaused(true);
  }, [isRunning, isPaused, computeElapsed]);

  const resume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    setStartedAt(new Date());
    setIsPaused(false);
  }, [isRunning, isPaused]);

  const stop = useCallback((): StopResult => {
    const finalElapsed = computeElapsed();
    clearTick();
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(finalElapsed);
    return { elapsedSeconds: finalElapsed, pomodoroCyclesCompleted };
  }, [computeElapsed, clearTick, pomodoroCyclesCompleted]);

  const reset = useCallback(() => {
    clearTick();
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
    setAccumulatedSeconds(0);
    setElapsedSeconds(0);
    setPhaseStartElapsedSeconds(0);
    setPomodoroPhase('work');
    setPomodoroCyclesCompleted(0);
  }, [clearTick]);

  // Adds extra seconds on top of the current total. Not used for background
  // catch-up (see sync()) - kept for cases where a caller needs to manually
  // adjust the running total.
  const addElapsedSeconds = useCallback((seconds: number) => {
    setAccumulatedSeconds((prev) => prev + seconds);
    setElapsedSeconds((prev) => prev + seconds);
  }, []);

  // Forces an immediate recompute from the wall clock instead of waiting for
  // the next 1s tick. Safe to call anytime (e.g. on app foreground) since it
  // re-derives from computeElapsed() rather than adding a delta - computeElapsed
  // already reflects any time that passed while ticks weren't firing.
  const sync = useCallback(() => {
    setElapsedSeconds(computeElapsed());
  }, [computeElapsed]);

  const phaseElapsed = mode === 'pomodoro' ? elapsedSeconds - phaseStartElapsedSeconds : elapsedSeconds;
  const remainingSeconds =
    phaseTargetSeconds !== null ? Math.max(phaseTargetSeconds - phaseElapsed, 0) : null;

  const displayTime = formatDisplayTime(remainingSeconds !== null ? remainingSeconds : elapsedSeconds);

  return {
    isRunning,
    isPaused,
    elapsedSeconds,
    remainingSeconds,
    displayTime,
    pomodoroPhase,
    pomodoroCyclesCompleted,
    startedAt,
    accumulatedSeconds,
    start,
    pause,
    resume,
    stop,
    reset,
    addElapsedSeconds,
    sync,
  };
}

function formatDisplayTime(totalSeconds: number): string {
  const safeSeconds = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
