import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTimerContext } from '../../context/TimerContext';
import TimerModeSelector from './TimerModeSelector';
import PomodoroControls from './PomodoroControls';
import { WORK_TYPE_OPTIONS, STUDY_MODE_OPTIONS } from '../../constants/workTypes';
import type { Course } from '../../lib/types';

type Props = {
  onCoursesLoaded?: (courses: Course[]) => void;
};

const COUNTDOWN_MIN_MINUTES = 5;
const COUNTDOWN_MAX_MINUTES = 180;
const COUNTDOWN_STEP_MINUTES = 5;

export default function PreSessionForm({ onCoursesLoaded }: Props) {
  const { user } = useAuth();
  const {
    mode,
    courseId,
    workType,
    workTypeCustom,
    location,
    studyMode,
    countdownTargetSeconds,
    pomodoroWorkMinutes,
    pomodoroBreakMinutes,
    setMode,
    setMetadata,
    setPomodoroConfig,
    setCountdownTarget,
  } = useTimerContext();

  const [courses, setCourses] = useState<Course[]>([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadCourses = async () => {
      const { data: semester } = await supabase
        .from('semesters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!semester) {
        setCourses([]);
        onCoursesLoaded?.([]);
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', semester.id);

      if (error) {
        console.error('Error fetching courses:', error.message);
        return;
      }

      setCourses(data ?? []);
      onCoursesLoaded?.(data ?? []);
    };

    loadCourses();
  }, [user, onCoursesLoaded]);

  const countdownMinutes = Math.round(countdownTargetSeconds / 60);

  return (
    <View style={styles.container}>
      <TimerModeSelector mode={mode} onChange={setMode} />

      {mode === 'countdown' && (
        <View style={styles.durationPicker}>
          <Text style={styles.sectionLabel}>Duration</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperButton}
              onPress={() =>
                setCountdownTarget(
                  Math.max(COUNTDOWN_MIN_MINUTES, countdownMinutes - COUNTDOWN_STEP_MINUTES) * 60
                )
              }
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{countdownMinutes} min</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() =>
                setCountdownTarget(
                  Math.min(COUNTDOWN_MAX_MINUTES, countdownMinutes + COUNTDOWN_STEP_MINUTES) * 60
                )
              }
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      )}

      {mode === 'pomodoro' && (
        <PomodoroControls
          workMinutes={pomodoroWorkMinutes}
          breakMinutes={pomodoroBreakMinutes}
          onChange={setPomodoroConfig}
        />
      )}

      <Text style={styles.sectionLabel}>Course</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseRow}>
        <Pressable
          style={[styles.coursePill, courseId === null && styles.coursePillSelected]}
          onPress={() => setMetadata({ courseId: null })}
        >
          <Text style={[styles.coursePillText, courseId === null && styles.coursePillTextSelected]}>
            None
          </Text>
        </Pressable>
        {courses.map((course) => {
          const selected = courseId === course.id;
          return (
            <Pressable
              key={course.id}
              style={[
                styles.coursePill,
                selected && { backgroundColor: course.color, borderColor: course.color },
              ]}
              onPress={() => setMetadata({ courseId: course.id })}
            >
              <View style={[styles.courseDot, { backgroundColor: course.color }]} />
              <Text
                style={[styles.coursePillText, selected && styles.coursePillTextSelected]}
                numberOfLines={1}
              >
                {course.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>What are you working on?</Text>
      <View style={styles.workTypeGroup}>
        {WORK_TYPE_OPTIONS.map((type) => {
          const selected = workType === type.value;
          return (
            <Pressable
              key={type.value}
              style={[styles.workTypeButton, selected && styles.workTypeButtonSelected]}
              onPress={() => setMetadata({ workType: type.value })}
            >
              <Text
                style={[styles.workTypeText, selected && styles.workTypeTextSelected]}
              >
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {workType === 'other' && (
        <TextInput
          style={styles.input}
          placeholder="What kind of work?"
          placeholderTextColor={colors.subtext}
          value={workTypeCustom ?? ''}
          onChangeText={(text) => setMetadata({ workTypeCustom: text })}
        />
      )}

      <Pressable onPress={() => setShowMoreOptions((prev) => !prev)}>
        <Text style={styles.moreOptionsToggle}>
          {showMoreOptions ? 'Hide options' : 'More options'}
        </Text>
      </Pressable>

      {showMoreOptions && (
        <View style={styles.moreOptions}>
          <TextInput
            style={styles.input}
            placeholder="Location (optional)"
            placeholderTextColor={colors.subtext}
            value={location ?? ''}
            onChangeText={(text) => setMetadata({ location: text })}
          />

          <Text style={styles.sectionLabel}>Study mode</Text>
          <View style={styles.studyModeGroup}>
            {STUDY_MODE_OPTIONS.map((option) => {
              const selected = studyMode === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.studyModePill, selected && styles.studyModePillSelected]}
                  onPress={() =>
                    setMetadata({ studyMode: selected ? null : option.value })
                  }
                >
                  <Text
                    style={[styles.studyModeText, selected && styles.studyModeTextSelected]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
  },
  durationPicker: {
    gap: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 16,
    color: colors.text,
    minWidth: 64,
    textAlign: 'center',
  },
  courseRow: {
    flexGrow: 0,
  },
  coursePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: 8,
    maxWidth: 140,
  },
  coursePillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  coursePillText: {
    fontSize: 13,
    color: colors.text,
  },
  coursePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  courseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workTypeGroup: {
    gap: 8,
  },
  workTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  workTypeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  workTypeText: {
    fontSize: 14,
    color: colors.text,
  },
  workTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  moreOptionsToggle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  moreOptions: {
    gap: 12,
  },
  studyModeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  studyModePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  studyModePillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  studyModeText: {
    fontSize: 13,
    color: colors.text,
  },
  studyModeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
