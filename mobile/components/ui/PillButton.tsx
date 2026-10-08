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
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export type PillButtonVariant = 'primary' | 'brand' | 'glass' | 'ghost';
export type PillButtonSize = 'sm' | 'md' | 'lg';

export interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: PillButtonVariant;
  size?: PillButtonSize;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const PillButton: React.FC<PillButtonProps> = ({
  title,
  onPress,
  variant = 'glass',
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

  const handlePress = () => {
    if (!isInteractive) return;
    if (variant === 'brand') {
      hapticFeedback.medium();
    } else {
      hapticFeedback.light();
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
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
          color={variant === 'brand' ? Colors.textOnRed : Colors.ivoryMist}
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
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: TouchTarget.minWidth,
    minHeight: TouchTarget.minHeight,
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
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.25)',
  },
  brand: {
    backgroundColor: Colors.racingRed,
    borderWidth: 1,
    borderColor: Colors.racingRed,
  },
  glass: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  sm: {
    minHeight: TouchTarget.minHeight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  lg: {
    minHeight: 54,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },

  // States
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },

  // Text
  textBase: {
    fontFamily: Fonts.sansSemiBold,
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.ivoryMist,
  },
  brandText: {
    color: Colors.textOnRed,
  },
  glassText: {
    color: Colors.ivoryMist,
  },
  ghostText: {
    color: Colors.ivoryMist,
  },

  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 16,
  },
  disabledText: {
    color: Colors.textMuted,
  },
});

export default PillButton;
