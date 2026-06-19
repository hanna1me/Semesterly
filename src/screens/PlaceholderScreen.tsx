import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

type Props = {
  label: string;
};

export default function PlaceholderScreen({ label }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label} coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 16,
    color: colors.subtext,
  },
});
