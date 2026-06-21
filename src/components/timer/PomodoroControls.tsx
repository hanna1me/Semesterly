import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

type Props = {
  workMinutes: number;
  breakMinutes: number;
  onChange: (config: { workMinutes?: number; breakMinutes?: number }) => void;
};

const STEP = 5;
const WORK_MIN = 5;
const WORK_MAX = 60;
const BREAK_MIN = 1;
const BREAK_MAX = 30;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function Stepper({
  label,
  value,
  min,
  max,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
          onPress={onDecrement}
          disabled={value <= min}
        >
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value} min</Text>
        <Pressable
          style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]}
          onPress={onIncrement}
          disabled={value >= max}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PomodoroControls({ workMinutes, breakMinutes, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Stepper
        label="Work"
        value={workMinutes}
        min={WORK_MIN}
        max={WORK_MAX}
        onDecrement={() => onChange({ workMinutes: clamp(workMinutes - STEP, WORK_MIN, WORK_MAX) })}
        onIncrement={() => onChange({ workMinutes: clamp(workMinutes + STEP, WORK_MIN, WORK_MAX) })}
      />
      <Stepper
        label="Break"
        value={breakMinutes}
        min={BREAK_MIN}
        max={BREAK_MAX}
        onDecrement={() => onChange({ breakMinutes: clamp(breakMinutes - STEP, BREAK_MIN, BREAK_MAX) })}
        onIncrement={() => onChange({ breakMinutes: clamp(breakMinutes + STEP, BREAK_MIN, BREAK_MAX) })}
      />
      <Text style={styles.preview}>
        {workMinutes} min work · {breakMinutes} min break
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 14,
    color: colors.text,
    minWidth: 56,
    textAlign: 'center',
  },
  preview: {
    fontSize: 12,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 4,
  },
});
