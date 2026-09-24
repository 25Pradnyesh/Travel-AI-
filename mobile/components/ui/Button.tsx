import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        pressed && isInteractive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.canvas : Colors.textPrimary}
        />
      ) : (
        <View style={styles.contentRow}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text
            style={[
              styles.textBase,
              styles[`${variant}Text`],
              styles[`${size}Text`],
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: TouchTarget.minWidth,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.surfaceDark,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderFocus,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  sm: {
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  lg: {
    minHeight: 54,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },

  // States
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },

  // Text Base
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.canvas,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  outlineText: {
    color: Colors.textPrimary,
  },
  ghostText: {
    color: Colors.textPrimary,
  },

  // Text Sizes
  smText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  mdText: {
    ...Typography.body,
    fontWeight: '600',
  },
  lgText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: Colors.textMuted,
  },
});

export default Button;
