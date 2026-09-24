import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, TouchTarget } from '@/constants/theme';

export type IconButtonVariant = 'surface' | 'dark' | 'ghost' | 'subtle';

export interface IconButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: IconButtonVariant;
  rounded?: boolean;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  children,
  variant = 'surface',
  rounded = false,
  disabled = false,
  size = TouchTarget.minWidth,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          width: Math.max(size, TouchTarget.minWidth),
          height: Math.max(size, TouchTarget.minHeight),
          borderRadius: rounded ? Radius.full : Radius.xl,
        },
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  dark: {
    backgroundColor: Colors.surfaceDark,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  subtle: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.4,
  },
});

export default IconButton;
