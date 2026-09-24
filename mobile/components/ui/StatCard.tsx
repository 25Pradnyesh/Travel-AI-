import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.labelText}>{label.toUpperCase()}</Text>
      </View>
      <Text style={styles.valueText} numberOfLines={1}>
        {value}
      </Text>
      {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  labelText: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
  },
  valueText: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  subtitleText: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default StatCard;
