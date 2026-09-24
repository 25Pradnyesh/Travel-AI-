import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  type?: ToastType;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  icon,
  style,
}) => {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={16} color={Colors.verified} />;
      case 'warning':
        return <Ionicons name="warning" size={16} color={Colors.partial} />;
      case 'error':
        return <Ionicons name="alert-circle" size={16} color={Colors.error} />;
      default:
        return <Ionicons name="information-circle" size={16} color={Colors.surfaceDark} />;
    }
  };

  return (
    <View
      style={[styles.container, styles[type], style]}
      accessible={true}
      accessibilityRole="alert"
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.elevated,
    alignSelf: 'center',
    maxWidth: '92%',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  messageText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  info: {
    borderColor: Colors.borderSubtle,
  },
  success: {
    borderColor: Colors.verifiedBorder,
  },
  warning: {
    borderColor: Colors.partialBorder,
  },
  error: {
    borderColor: Colors.errorBorder,
  },
});

export default Toast;
