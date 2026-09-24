import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export type BadgeVariant = 'default' | 'subtle' | 'dark' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  icon,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },

  default: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  defaultText: {
    color: Colors.textSecondary,
  },

  subtle: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  subtleText: {
    color: Colors.textMuted,
  },

  dark: {
    backgroundColor: Colors.surfaceDark,
  },
  darkText: {
    color: Colors.canvas,
  },

  success: {
    backgroundColor: Colors.verifiedSurface,
    borderWidth: 1,
    borderColor: Colors.verifiedBorder,
  },
  successText: {
    color: Colors.verified,
  },

  warning: {
    backgroundColor: Colors.partialSurface,
    borderWidth: 1,
    borderColor: Colors.partialBorder,
  },
  warningText: {
    color: Colors.partial,
  },

  error: {
    backgroundColor: Colors.errorSurface,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  errorText: {
    color: Colors.error,
  },

  info: {
    backgroundColor: Colors.infoSurface,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
  },
  infoText: {
    color: Colors.info,
  },
});

export default Badge;
