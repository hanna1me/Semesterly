import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import type { TimerMode } from '../../types/session';

type Props = {
  mode: TimerMode;
  onChange: (mode: TimerMode) => void;
};

const OPTIONS: { mode: TimerMode; label: string }[] = [
  { mode: 'stopwatch', label: 'Stopwatch' },
  { mode: 'countdown', label: 'Countdown' },
  { mode: 'pomodoro', label: 'Pomodoro' },
];

export default function TimerModeSelector({ mode, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => onChange(option.mode)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
