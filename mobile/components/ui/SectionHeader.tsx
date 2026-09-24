import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

export interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  eyebrow,
  rightActionLabel,
  onRightActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        {eyebrow && <Text style={styles.eyebrowText}>{eyebrow.toUpperCase()}</Text>}
        <Text style={styles.titleText}>{title}</Text>
      </View>
      {rightActionLabel && onRightActionPress && (
        <Pressable
          onPress={onRightActionPress}
          hitSlop={8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={rightActionLabel}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{rightActionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  eyebrowText: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  titleText: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  actionButton: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
  actionText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default SectionHeader;
