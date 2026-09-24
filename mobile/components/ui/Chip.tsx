import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  count?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  count,
  icon,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
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
    minHeight: Math.max(36, TouchTarget.minHeight * 0.8),
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  unselected: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  selected: {
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.surfaceDark,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    fontSize: 12,
  },
  labelUnselected: {
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.canvas,
  },
  count: {
    ...Typography.caption,
    fontSize: 11,
    marginLeft: Spacing.xs,
  },
  countUnselected: {
    color: Colors.textMuted,
  },
  countSelected: {
    color: 'rgba(247, 247, 245, 0.75)',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});

export default Chip;
