import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Analysis Unavailable',
  message = "Travel AI couldn't complete the analysis. Please check the Reel URL and try again.",
  onRetry,
  retryLabel = 'Try Again',
  onCancel,
  cancelLabel = 'Go Back',
  style,
}) => {
  return (
    <View style={[styles.container, style]} accessible={true} accessibilityRole="alert">
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle-outline" size={28} color={Colors.error} />
        </View>

        <Text style={styles.label}>NOTICE</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttonRow}>
          {onCancel && (
            <Button
              title={cancelLabel}
              variant="outline"
              size="sm"
              onPress={onCancel}
              style={styles.actionBtn}
            />
          )}
          {onRetry && (
            <Button
              title={retryLabel}
              variant="primary"
              size="sm"
              onPress={onRetry}
              style={styles.actionBtn}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.canvas,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: Radius.xl,
    backgroundColor: Colors.errorSurface,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs + 2,
  },
  message: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    minWidth: 110,
  },
});

export default ErrorState;
