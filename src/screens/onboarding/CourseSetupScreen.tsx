import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { colors, coursePalette } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CourseCard from '../../components/CourseCard';
import ColorPicker from '../../components/ColorPicker';
import type { OnboardingStackParamList } from '../../navigation/types';
import type { Course } from '../../lib/types';

type Props = StackScreenProps<OnboardingStackParamList, 'CourseSetup'>;

export default function CourseSetupScreen({ route }: Props) {
  const { schoolName, semesterId } = route.params;
  const { user, refreshProfile } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [credits, setCredits] = useState('');
  const [instructor, setInstructor] = useState('');
  const [color, setColor] = useState(coursePalette[0]);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadCourses = async () => {
      const { data, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('semester_id', semesterId);

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setCourses(data ?? []);
    };

    loadCourses();
  }, [user, semesterId]);

  const resetForm = () => {
    setName('');
    setCourseCode('');
    setCredits('');
    setInstructor('');
    setColor(coursePalette[0]);
    setShowForm(false);
  };

  const handleAddCourse = async () => {
    if (!user || name.trim().length === 0) {
      setError('Course name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        semester_id: semesterId,
        name: name.trim(),
        course_code: courseCode.trim() || null,
        credits: credits.trim() ? parseFloat(credits.trim()) : null,
        instructor: instructor.trim() || null,
        color,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError(insertError?.message ?? 'Could not save course.');
      return;
    }

    setCourses((prev) => [...prev, data]);
    resetForm();
  };

  const handleDeleteCourse = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      Alert.alert('Error', deleteError.message);
      return;
    }

    setCourses((prev) => prev.filter((course) => course.id !== id));
  };

  const handleDone = async () => {
    if (!user) return;

    setFinishing(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ school_name: schoolName })
      .eq('id', user.id);
    setFinishing(false);

    if (updateError) {
      Alert.alert('Error', updateError.message);
      return;
    }

    await refreshProfile();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add your courses</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CourseCard course={item} onDelete={handleDeleteCourse} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No courses added yet.</Text>
        }
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showForm ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Course name"
            placeholderTextColor={colors.subtext}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Course code (optional)"
            placeholderTextColor={colors.subtext}
            value={courseCode}
            onChangeText={setCourseCode}
          />
          <TextInput
            style={styles.input}
            placeholder="Credits (optional)"
            placeholderTextColor={colors.subtext}
            keyboardType="decimal-pad"
            value={credits}
            onChangeText={setCredits}
          />
          <TextInput
            style={styles.input}
            placeholder="Instructor (optional)"
            placeholderTextColor={colors.subtext}
            value={instructor}
            onChangeText={setInstructor}
          />
          <ColorPicker selectedColor={color} onSelect={setColor} />

          <View style={styles.formActions}>
            <Pressable style={styles.secondaryButton} onPress={resetForm}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={handleAddCourse}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Add Course</Text>
        </Pressable>
      )}

      <Pressable
        style={[
          styles.doneButton,
          (courses.length === 0 || finishing) && styles.disabledButton,
        ]}
        onPress={handleDone}
        disabled={courses.length === 0 || finishing}
      >
        <Text style={styles.primaryButtonText}>
          {finishing ? 'Finishing...' : 'Done'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 8,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
