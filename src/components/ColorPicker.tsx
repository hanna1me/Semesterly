import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { coursePalette } from '../constants/colors';

type Props = {
  selectedColor: string;
  onSelect: (color: string) => void;
};

export default function ColorPicker({ selectedColor, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {coursePalette.map((color) => {
        const isSelected = color === selectedColor;
        return (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={[
              styles.swatch,
              { backgroundColor: color },
              isSelected && styles.swatchSelected,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
