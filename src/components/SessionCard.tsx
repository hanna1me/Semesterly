import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { getWorkTypeLabel } from '../constants/workTypes';
import { formatDuration, formatDateTime } from '../lib/format';
import type { SessionWithCourse } from '../types/session';

type Props = {
  session: SessionWithCourse;
  onPress: (session: SessionWithCourse) => void;
};

const FOCUS_EMOJI: Record<number, string> = {
  1: '😴',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '🔥',
};

const STUDY_MODE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  solo: 'person-outline',
  with_friends: 'people-outline',
  background_noise: 'volume-medium-outline',
  focus_music: 'musical-notes-outline',
};

export default function SessionCard({ session, onPress }: Props) {
  const courseColor = session.courses?.color ?? colors.border;

  return (
    <Pressable style={styles.card} onPress={() => onPress(session)}>
      <View style={[styles.colorBar, { backgroundColor: courseColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.courseName} numberOfLines={1}>
            {session.courses?.name ?? 'No course'}
          </Text>
          <Text style={styles.duration}>
            {formatDuration(session.duration_seconds ?? 0)}
          </Text>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.workTypeBadge}>
            <Text style={styles.workTypeText}>
              {getWorkTypeLabel(session.work_type, session.work_type_custom)}
            </Text>
          </View>
          {session.study_mode && (
            <Ionicons
              name={STUDY_MODE_ICON[session.study_mode]}
              size={14}
              color={colors.subtext}
            />
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.dateText}>{formatDateTime(session.started_at)}</Text>
          {session.focus_rating ? (
            <Text style={styles.focusEmoji}>{FOCUS_EMOJI[session.focus_rating]}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  duration: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workTypeBadge: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  workTypeText: {
    fontSize: 11,
    color: colors.subtext,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.subtext,
  },
  focusEmoji: {
    fontSize: 14,
  },
});
