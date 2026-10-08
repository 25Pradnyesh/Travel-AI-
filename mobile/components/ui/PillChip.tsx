import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface PillChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  count?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PillChip: React.FC<PillChipProps> = ({
  label,
  selected = false,
  onPress,
  count,
  icon,
  style,
}) => {
  const handlePress = () => {
    hapticFeedback.selection();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${count != null ? `, ${count} items` : ''}`}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
          {label}
        </Text>
        {count !== undefined && (
          <Text style={[styles.count, selected ? styles.countSelected : styles.countUnselected]}>
            ({count})
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.xs + 2,
  },
  unselected: {
    backgroundColor: Colors.glassBg,
    borderColor: Colors.glassBorder,
  },
  selected: {
    backgroundColor: Colors.onyx,
    borderColor: 'rgba(251, 244, 227, 0.45)',
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
  },
  labelUnselected: {
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.ivoryMist,
    fontFamily: Fonts.sansSemiBold,
  },
  count: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    marginLeft: Spacing.xs,
  },
  countUnselected: {
    color: Colors.textMuted,
  },
  countSelected: {
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});

export default PillChip;
