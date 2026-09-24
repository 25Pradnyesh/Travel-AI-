import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  eyebrow,
  title,
  description,
  actionLabel,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]} accessible={true}>
      <View style={styles.card}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        {eyebrow && <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>}
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}

        {actionLabel && onActionPress && (
          <View style={styles.actionContainer}>
            <Button
              title={actionLabel}
              variant="primary"
              size="sm"
              onPress={onActionPress}
              accessibilityLabel={actionLabel}
            />
          </View>
        )}
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
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs + 2,
  },
  description: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
});

export default EmptyState;
