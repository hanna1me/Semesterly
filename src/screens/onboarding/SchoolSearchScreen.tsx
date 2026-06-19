import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { colors } from '../../constants/colors';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = StackScreenProps<OnboardingStackParamList, 'SchoolSearch'>;

type University = {
  name: string;
  country: string;
  state_province: string | null;
};

export default function SchoolSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `http://universities.hipolabs.com/search?name=${encodeURIComponent(
            query.trim()
          )}&country=United+States`
        );
        const data: University[] = await response.json();
        setResults(data);
        setError(null);
      } catch {
        setError('Could not load schools. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (schoolName: string) => {
    navigation.navigate('SemesterSelect', { schoolName });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What school do you go to?</Text>

      <TextInput
        style={styles.input}
        placeholder="Search for your school"
        placeholderTextColor={colors.subtext}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          ListEmptyComponent={
            query.trim().length > 0 ? (
              <Text style={styles.emptyText}>No schools found.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultRow}
              onPress={() => handleSelect(item.name)}
            >
              <Text style={styles.resultName}>{item.name}</Text>
              {item.state_province ? (
                <Text style={styles.resultSubtitle}>{item.state_province}</Text>
              ) : null}
            </Pressable>
          )}
        />
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.subtext,
    textAlign: 'center',
    marginTop: 24,
  },
  resultRow: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 2,
  },
});
