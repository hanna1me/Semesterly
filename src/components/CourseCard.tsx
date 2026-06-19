import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import type { Course } from '../lib/types';

type Props = {
  course: Course;
  onDelete: (id: string) => void;
};

export default function CourseCard({ course, onDelete }: Props) {
  const subtitle = [course.course_code, course.credits ? `${course.credits} credits` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={[styles.colorBar, { backgroundColor: course.color }]} />
      <View style={styles.content}>
        <Text style={styles.name}>{course.name}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable onPress={() => onDelete(course.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color={colors.subtext} />
      </Pressable>
    </View>
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
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 2,
  },
  deleteButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
});
