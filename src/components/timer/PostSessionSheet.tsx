import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTimerContext } from '../../context/TimerContext';
import { getWorkTypeLabel } from '../../constants/workTypes';
import { formatDuration } from '../../lib/format';
import type { Course } from '../../lib/types';

type Props = {
  courses: Course[];
  semesterId: string | null;
  onSaved?: () => void;
};

const FOCUS_OPTIONS: { value: number; emoji: string }[] = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😐' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '🔥' },
];

const NOTES_MAX_LENGTH = 500;
const SHORT_SESSION_SECONDS = 120;

export default function PostSessionSheet({ courses, semesterId, onSaved }: Props) {
  const { user } = useAuth();
  const { completedSession, resetTimer } = useTimerContext();

  const [focusRating, setFocusRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (completedSession) {
      setFocusRating(null);
      setNotes('');
      setError(null);
    }
  }, [completedSession]);

  if (!completedSession) {
    return null;
  }

  const course = courses.find((c) => c.id === completedSession.courseId);
  const isShortSession = completedSession.durationSeconds < SHORT_SESSION_SECONDS;

  const handleDiscard = () => {
    resetTimer();
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('sessions').insert({
      user_id: user.id,
      course_id: completedSession.courseId,
      semester_id: semesterId,
      timer_mode: completedSession.mode,
      started_at: completedSession.startedAt.toISOString(),
      ended_at: completedSession.endedAt.toISOString(),
      duration_seconds: completedSession.durationSeconds,
      work_type: completedSession.workType,
      work_type_custom: completedSession.workTypeCustom,
      location: completedSession.location,
      study_mode: completedSession.studyMode,
      focus_rating: focusRating,
      notes: notes.trim() || null,
      pomodoro_work_minutes: completedSession.pomodoroWorkMinutes,
      pomodoro_break_minutes: completedSession.pomodoroBreakMinutes,
      pomodoro_cycles_completed: completedSession.pomodoroCyclesCompleted,
      countdown_target_seconds: completedSession.countdownTargetSeconds,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    resetTimer();
    onSaved?.();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleDiscard}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[styles.courseName, course ? { color: course.color } : null]}>
              {course ? course.name : 'No course'}
            </Text>
            <Text style={styles.workType}>
              {completedSession.workType
                ? getWorkTypeLabel(completedSession.workType, completedSession.workTypeCustom)
                : 'Studying'}
            </Text>
            <Text style={styles.duration}>{formatDuration(completedSession.durationSeconds)}</Text>
          </View>

          {isShortSession && (
            <Text style={styles.shortSessionNotice}>
              This session is under 2 minutes. Save or discard?
            </Text>
          )}

          <Text style={styles.sectionLabel}>How was your focus?</Text>
          <View style={styles.focusRow}>
            {FOCUS_OPTIONS.map((option) => {
              const selected = focusRating === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.focusButton, selected && styles.focusButtonSelected]}
                  onPress={() => setFocusRating(selected ? null : option.value)}
                >
                  <Text style={styles.focusEmoji}>{option.emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="How'd it go? (optional)"
            placeholderTextColor={colors.subtext}
            multiline
            maxLength={NOTES_MAX_LENGTH}
            value={notes}
            onChangeText={setNotes}
          />
          <Text style={styles.charCount}>
            {notes.length}/{NOTES_MAX_LENGTH}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Session'}
            </Text>
          </Pressable>

          <Pressable onPress={handleDiscard} disabled={saving}>
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  workType: {
    fontSize: 14,
    color: colors.subtext,
  },
  duration: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  shortSessionNotice: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
  },
  focusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  focusButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  focusButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
    transform: [{ scale: 1.1 }],
  },
  focusEmoji: {
    fontSize: 24,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: colors.subtext,
    textAlign: 'right',
    marginTop: -8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  discardText: {
    textAlign: 'center',
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
});
