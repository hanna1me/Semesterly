import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTimer } from '../hooks/useTimer';
import type { PomodoroPhase, StudyMode, TimerMode, WorkType } from '../types/session';

const BACKGROUNDED_AT_KEY = 'semesterly:timer:backgroundedAt';
const DEFAULT_COUNTDOWN_SECONDS = 25 * 60;
const DEFAULT_POMODORO_WORK_MINUTES = 25;
const DEFAULT_POMODORO_BREAK_MINUTES = 5;

type TimerMetadata = {
  courseId: string | null;
  workType: WorkType | null;
  workTypeCustom: string | null;
  location: string | null;
  studyMode: StudyMode | null;
};

const DEFAULT_METADATA: TimerMetadata = {
  courseId: null,
  workType: null,
  workTypeCustom: null,
  location: null,
  studyMode: null,
};

export type CompletedSessionSummary = {
  mode: TimerMode;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
  courseId: string | null;
  workType: WorkType | null;
  workTypeCustom: string | null;
  location: string | null;
  studyMode: StudyMode | null;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroCyclesCompleted: number;
  countdownTargetSeconds: number | null;
};

type TimerContextValue = {
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  displayTime: string;
  pomodoroPhase: PomodoroPhase;
  pomodoroCyclesCompleted: number;

  courseId: string | null;
  workType: WorkType | null;
  workTypeCustom: string | null;
  location: string | null;
  studyMode: StudyMode | null;

  countdownTargetSeconds: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;

  completedSession: CompletedSessionSummary | null;

  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setMetadata: (metadata: Partial<TimerMetadata>) => void;
  setMode: (mode: TimerMode) => void;
  setPomodoroConfig: (config: { workMinutes?: number; breakMinutes?: number }) => void;
  setCountdownTarget: (seconds: number) => void;
};

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<TimerMode>('stopwatch');
  const [countdownTargetSeconds, setCountdownTargetState] = useState(DEFAULT_COUNTDOWN_SECONDS);
  const [pomodoroWorkMinutes, setPomodoroWorkMinutes] = useState(DEFAULT_POMODORO_WORK_MINUTES);
  const [pomodoroBreakMinutes, setPomodoroBreakMinutes] = useState(DEFAULT_POMODORO_BREAK_MINUTES);
  const [metadata, setMetadataState] = useState<TimerMetadata>(DEFAULT_METADATA);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [completedSession, setCompletedSession] = useState<CompletedSessionSummary | null>(null);

  // onCountdownComplete needs to call stopTimer, but stopTimer is derived from
  // this same useTimer() call's return value - a ref breaks the cycle.
  const stopTimerRef = useRef<() => void>(() => {});
  const handleCountdownComplete = useCallback(() => {
    stopTimerRef.current();
  }, []);

  const timer = useTimer({
    mode,
    countdownTargetSeconds,
    pomodoroWorkMinutes,
    pomodoroBreakMinutes,
    onCountdownComplete: handleCountdownComplete,
  });

  const startTimer = useCallback(() => {
    setSessionStartedAt(new Date());
    setCompletedSession(null);
    timer.start();
  }, [timer]);

  const stopTimer = useCallback(() => {
    const result = timer.stop();
    const endedAt = new Date();

    if (sessionStartedAt) {
      setCompletedSession({
        mode,
        startedAt: sessionStartedAt,
        endedAt,
        durationSeconds: result.elapsedSeconds,
        courseId: metadata.courseId,
        workType: metadata.workType,
        workTypeCustom: metadata.workTypeCustom,
        location: metadata.location,
        studyMode: metadata.studyMode,
        pomodoroWorkMinutes,
        pomodoroBreakMinutes,
        pomodoroCyclesCompleted: result.pomodoroCyclesCompleted,
        countdownTargetSeconds: mode === 'countdown' ? countdownTargetSeconds : null,
      });
    }
  }, [timer, sessionStartedAt, mode, metadata, pomodoroWorkMinutes, pomodoroBreakMinutes, countdownTargetSeconds]);

  useEffect(() => {
    stopTimerRef.current = stopTimer;
  }, [stopTimer]);

  const resetTimer = useCallback(() => {
    timer.reset();
    setSessionStartedAt(null);
    setCompletedSession(null);
    setMetadataState(DEFAULT_METADATA);
  }, [timer]);

  const setMetadata = useCallback(
    (partial: Partial<TimerMetadata>) => {
      if (timer.isRunning) return;
      setMetadataState((prev) => ({ ...prev, ...partial }));
    },
    [timer.isRunning]
  );

  const setMode = useCallback(
    (next: TimerMode) => {
      if (timer.isRunning) return;
      setModeState(next);
    },
    [timer.isRunning]
  );

  const setPomodoroConfig = useCallback(
    ({ workMinutes, breakMinutes }: { workMinutes?: number; breakMinutes?: number }) => {
      if (timer.isRunning) return;
      if (workMinutes !== undefined) setPomodoroWorkMinutes(workMinutes);
      if (breakMinutes !== undefined) setPomodoroBreakMinutes(breakMinutes);
    },
    [timer.isRunning]
  );

  const setCountdownTarget = useCallback(
    (seconds: number) => {
      if (timer.isRunning) return;
      setCountdownTargetState(seconds);
    },
    [timer.isRunning]
  );

  // Background/foreground handling.
  //
  // useTimer's elapsed math is wall-clock based (Date.now() - startedAt), so
  // as long as the JS context survives backgrounding, computeElapsed() already
  // self-corrects for however long the app was backgrounded - no catch-up
  // needed. The AsyncStorage timestamp here is a defensive record only; on
  // foreground we just force an immediate resync (timer.sync()) so the
  // display doesn't sit stale for up to a second waiting on the next tick.
  // We deliberately do NOT add the stored delta on top of computeElapsed() -
  // that would double count the same gap. If the JS context is fully torn
  // down while backgrounded (OS memory pressure), isRunning resets to false
  // on remount and this whole running session is lost - true cross-restart
  // persistence would require snapshotting the full TimerState, not just a
  // timestamp, which is out of scope for this MVP.
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        if (timer.isRunning && !timer.isPaused) {
          await AsyncStorage.setItem(BACKGROUNDED_AT_KEY, String(Date.now()));
        }
        return;
      }

      if (nextState === 'active') {
        const stored = await AsyncStorage.getItem(BACKGROUNDED_AT_KEY);
        if (stored) {
          await AsyncStorage.removeItem(BACKGROUNDED_AT_KEY);
        }
        if (timer.isRunning && !timer.isPaused) {
          timer.sync();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [timer]);

  return (
    <TimerContext.Provider
      value={{
        isRunning: timer.isRunning,
        isPaused: timer.isPaused,
        mode,
        elapsedSeconds: timer.elapsedSeconds,
        remainingSeconds: timer.remainingSeconds,
        displayTime: timer.displayTime,
        pomodoroPhase: timer.pomodoroPhase,
        pomodoroCyclesCompleted: timer.pomodoroCyclesCompleted,

        courseId: metadata.courseId,
        workType: metadata.workType,
        workTypeCustom: metadata.workTypeCustom,
        location: metadata.location,
        studyMode: metadata.studyMode,

        countdownTargetSeconds,
        pomodoroWorkMinutes,
        pomodoroBreakMinutes,

        completedSession,

        startTimer,
        pauseTimer: timer.pause,
        resumeTimer: timer.resume,
        stopTimer,
        resetTimer,
        setMetadata,
        setMode,
        setPomodoroConfig,
        setCountdownTarget,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}
