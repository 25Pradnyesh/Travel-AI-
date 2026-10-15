import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import PillButton from './PillButton';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  titleAccent?: string; // Accent word rendered in Instrument Serif Italic
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  eyebrow,
  title,
  titleAccent,
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

        <Text style={styles.title}>
          {title}
          {titleAccent ? (
            <Text style={styles.titleAccent}> {titleAccent}</Text>
          ) : null}
        </Text>

        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {actionLabel && onActionPress && (
          <View style={styles.actionContainer}>
            <PillButton
              title={actionLabel}
              variant="primary"
              size="md"
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
    backgroundColor: Colors.glassDarkBg,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.glassDarkBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.icyBlue,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.ivoryMist,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  titleAccent: {
    fontFamily: Fonts.serifItalic,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.ivoryMist,
  },
  description: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
});

export default EmptyState;
