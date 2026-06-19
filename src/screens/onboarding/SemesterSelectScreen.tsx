import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = StackScreenProps<OnboardingStackParamList, 'SemesterSelect'>;

const TERMS = ['Fall', 'Spring', 'Summer', 'J-Term', 'Quarter'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

export default function SemesterSelectScreen({ navigation, route }: Props) {
  const { schoolName } = route.params;
  const { user } = useAuth();
  const [term, setTerm] = useState<string | null>(null);
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!term || !user) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('semesters')
      .insert({
        user_id: user.id,
        term,
        year,
        is_active: true,
      })
      .select()
      .single();
    setSaving(false);

    if (error || !data) {
      Alert.alert('Error', error?.message ?? 'Could not save semester.');
      return;
    }

    navigation.navigate('CourseSetup', { schoolName, semesterId: data.id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your semester</Text>

      <Text style={styles.label}>Term</Text>
      <View style={styles.optionRow}>
        {TERMS.map((option) => (
          <Pressable
            key={option}
            style={[styles.option, term === option && styles.optionSelected]}
            onPress={() => setTerm(option)}
          >
            <Text
              style={[
                styles.optionText,
                term === option && styles.optionTextSelected,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Year</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionRow}>
          {YEARS.map((option) => (
            <Pressable
              key={option}
              style={[styles.option, year === option && styles.optionSelected]}
              onPress={() => setYear(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  year === option && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable
        style={[
          styles.primaryButton,
          (!term || saving) && styles.disabledButton,
        ]}
        onPress={handleContinue}
        disabled={!term || saving}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? 'Saving...' : 'Continue'}
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
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtext,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
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
