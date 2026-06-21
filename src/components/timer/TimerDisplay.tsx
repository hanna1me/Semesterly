import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

type Props = {
  displayTime: string;
  size?: 'large' | 'small';
  lowTime?: boolean;
};

const SIZES = {
  large: { fontSize: 72, charWidth: 44 },
  small: { fontSize: 32, charWidth: 20 },
};

export default function TimerDisplay({ displayTime, size = 'large', lowTime = false }: Props) {
  const { fontSize, charWidth } = SIZES[size];
  const characters = displayTime.split('');

  return (
    <View style={styles.row}>
      {characters.map((char, index) => (
        <View key={index} style={[styles.charContainer, { width: char === ':' ? charWidth / 2 : charWidth }]}>
          <Text
            style={[
              styles.char,
              { fontSize, color: lowTime ? colors.error : colors.text },
            ]}
          >
            {char}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  charContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: {
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontWeight: '600',
  },
});
