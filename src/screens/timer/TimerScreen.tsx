import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTimerContext } from '../../context/TimerContext';
import { getWorkTypeLabel } from '../../constants/workTypes';
import PreSessionForm from '../../components/timer/PreSessionForm';
import PostSessionSheet from '../../components/timer/PostSessionSheet';
import TimerDisplay from '../../components/timer/TimerDisplay';
import type { StudyStackParamList } from '../../navigation/types';
import type { Course } from '../../lib/types';

type Props = StackScreenProps<StudyStackParamList, 'Timer'>;

const SHORT_SESSION_SECONDS = 120;

export default function TimerScreen({ navigation }: Props) {
  const { user } = useAuth();
  const {
    isRunning,
    isPaused,
    mode,
    elapsedSeconds,
    remainingSeconds,
    displayTime,
    pomodoroPhase,
    pomodoroCyclesCompleted,
    courseId,
    workType,
    workTypeCustom,
    countdownTargetSeconds,
    pomodoroWorkMinutes,
    pomodoroBreakMinutes,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useTimerContext();

  const [courses, setCourses] = useState<Course[]>([]);
  const [semesterId, setSemesterId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const formAnim = useRef(new Animated.Value(1)).current;
  const timerAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('SessionHistory')}
          style={{ paddingHorizontal: 16 }}
        >
          <Ionicons name="time-outline" size={24} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('semesters')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setSemesterId(data?.id ?? null));
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formAnim, {
        toValue: isRunning ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(timerAnim, {
        toValue: isRunning ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isRunning, formAnim, timerAnim]);

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setToastMessage(null));
    },
    [toastAnim]
  );

  const handleStop = () => {
    if (elapsedSeconds > SHORT_SESSION_SECONDS) {
      Alert.alert('Stop session?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => stopTimer() },
      ]);
      return;
    }
    stopTimer();
  };

  const handleDiscard = () => {
    if (elapsedSeconds < SHORT_SESSION_SECONDS) {
      Alert.alert('Discard session?', 'This session is under 2 minutes. Save or discard?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => stopTimer() },
        { text: 'Discard', style: 'destructive', onPress: () => resetTimer() },
      ]);
      return;
    }
    Alert.alert('Discard session?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => resetTimer() },
    ]);
  };

  const selectedCourse = courses.find((c) => c.id === courseId);

  const phaseTargetSeconds =
    mode === 'countdown'
      ? countdownTargetSeconds
      : mode === 'pomodoro'
        ? (pomodoroPhase === 'work' ? pomodoroWorkMinutes : pomodoroBreakMinutes) * 60
        : null;

  const progress =
    phaseTargetSeconds && remainingSeconds !== null
      ? Math.min(Math.max(1 - remainingSeconds / phaseTargetSeconds, 0), 1)
      : null;

  const lowTime = remainingSeconds !== null && remainingSeconds < 60;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.formContainer,
          {
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}
        pointerEvents={isRunning ? 'none' : 'auto'}
      >
        {!isRunning && (
          <>
            <PreSessionForm onCoursesLoaded={setCourses} />

            <Pressable
              style={[styles.startButton, !workType && styles.disabledButton]}
              onPress={startTimer}
              disabled={!workType}
            >
              <Text style={styles.startButtonText}>Start Session</Text>
            </Pressable>
          </>
        )}
      </Animated.View>

      {isRunning && (
        <Animated.View
          style={[
            styles.runningContainer,
            {
              opacity: timerAnim,
              transform: [{ scale: timerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            },
          ]}
        >
          <View style={styles.runningHeader}>
            {selectedCourse && (
              <View style={[styles.courseColorBar, { backgroundColor: selectedCourse.color }]} />
            )}
            <Text style={styles.courseName}>{selectedCourse ? selectedCourse.name : 'No course'}</Text>
            <Text style={styles.workTypeLabel}>
              {workType ? getWorkTypeLabel(workType, workTypeCustom) : ''}
            </Text>
          </View>

          {mode === 'pomodoro' && (
            <View style={styles.pomodoroInfo}>
              <Text style={styles.phaseLabel}>{pomodoroPhase === 'work' ? 'Work' : 'Break'}</Text>
              <Text style={styles.cycleLabel}>Cycle {pomodoroCyclesCompleted + 1}</Text>
            </View>
          )}

          <TimerDisplay displayTime={displayTime} size="large" lowTime={lowTime} />

          {progress !== null && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          )}

          <View style={styles.controlsRow}>
            <Pressable style={styles.controlButtonPrimary} onPress={isPaused ? resumeTimer : pauseTimer}>
              <Text style={styles.controlButtonPrimaryText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </Pressable>
            <Pressable style={styles.controlButtonSecondary} onPress={handleStop}>
              <Text style={styles.controlButtonSecondaryText}>Stop</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleDiscard}>
            <Text style={styles.discardLink}>Discard session</Text>
          </Pressable>
        </Animated.View>
      )}

      <PostSessionSheet
        courses={courses}
        semesterId={semesterId}
        onSaved={() => showToast('Session saved ✓')}
      />

      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  formContainer: {
    flex: 1,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  runningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  runningHeader: {
    alignItems: 'center',
    gap: 4,
  },
  courseColorBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  workTypeLabel: {
    fontSize: 13,
    color: colors.subtext,
  },
  pomodoroInfo: {
    alignItems: 'center',
    gap: 2,
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  cycleLabel: {
    fontSize: 13,
    color: colors.subtext,
  },
  progressTrack: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButtonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  controlButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  controlButtonSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  controlButtonSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  discardLink: {
    color: colors.error,
    fontSize: 13,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.text,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
