import React from 'react';
import {
  ActivityIndicator,
  DimensionValue,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import SkeletonShimmer from './SkeletonShimmer';
import PillButton from './PillButton';

export type LoadingStateVariant = 'card' | 'list' | 'hero' | 'spinner';

export interface LoadingStateProps {
  variant?: LoadingStateVariant;
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  style?: StyleProp<ViewStyle>;
  spinnerSize?: 'small' | 'large';
  spinnerColor?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = React.memo(({
  variant = 'card',
  title = 'Processing...',
  subtitle = 'VAMO is analyzing geographic clues and candidate landmarks.',
  onCancel,
  cancelLabel = 'Cancel',
  style,
  spinnerSize = 'small',
  spinnerColor = Colors.icyBlue,
}) => {
  if (variant === 'spinner') {
    return (
      <View style={[styles.inlineSpinnerContainer, style]}>
        <ActivityIndicator size={spinnerSize} color={spinnerColor} />
      </View>
    );
  }

  if (variant === 'hero') {
    return (
      <View style={[styles.container, style]} accessible={true} accessibilityRole="progressbar">
        <View style={styles.heroCard}>
          <SkeletonShimmer height={200} borderRadius={Radius.xl} style={styles.heroPoster} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <SkeletonShimmer width={72} height={20} borderRadius={Radius.pill} />
              <SkeletonShimmer width={96} height={20} borderRadius={Radius.pill} />
            </View>
            <SkeletonShimmer width="75%" height={26} borderRadius={Radius.sm} style={styles.mbSm} />
            <SkeletonShimmer width="50%" height={16} borderRadius={Radius.xs} style={styles.mbMd} />
            <Text style={styles.heroTitle}>{title}</Text>
            {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
            {onCancel && (
              <View style={styles.cancelWrapper}>
                <PillButton
                  title={cancelLabel}
                  variant="glass"
                  size="sm"
                  onPress={onCancel}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'list') {
    return (
      <View style={[styles.container, style]} accessible={true} accessibilityRole="progressbar">
        <View style={styles.listContainer}>
          {[1, 2, 3].map((idx) => (
            <View key={idx} style={styles.listItem}>
              <SkeletonShimmer width={54} height={54} borderRadius={Radius.lg} style={styles.listThumb} />
              <View style={styles.listTextCol}>
                <SkeletonShimmer width="65%" height={16} borderRadius={Radius.xs} style={styles.mbSm} />
                <SkeletonShimmer width="42%" height={12} borderRadius={Radius.xs} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Default: 'card'
  return (
    <View style={[styles.container, style]} accessible={true} accessibilityRole="progressbar">
      <View style={styles.card}>
        <View style={styles.shimmerIconBox}>
          <SkeletonShimmer width={52} height={52} borderRadius={Radius.xl} />
        </View>

        <Text style={styles.label}>LIVE ANALYSIS</Text>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.boneStack}>
          <SkeletonShimmer width="88%" height={10} borderRadius={Radius.xs} style={styles.mbSm} />
          <SkeletonShimmer width="64%" height={10} borderRadius={Radius.xs} />
        </View>

        {onCancel && (
          <View style={styles.actionContainer}>
            <PillButton
              title={cancelLabel}
              variant="glass"
              size="sm"
              onPress={onCancel}
              accessibilityLabel={cancelLabel}
            />
          </View>
        )}
      </View>
    </View>
  );
});

LoadingState.displayName = 'LoadingState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  inlineSpinnerContainer: {
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
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
  shimmerIconBox: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.icyBlue,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.ivoryMist,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  boneStack: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  listContainer: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassDarkBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassDarkBorder,
    padding: Spacing.md,
  },
  listThumb: {
    marginRight: Spacing.md,
  },
  listTextCol: {
    flex: 1,
  },
  heroCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.glassDarkBg,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.glassDarkBorder,
    padding: Spacing.base,
    overflow: 'hidden',
  },
  heroPoster: {
    marginBottom: Spacing.md,
  },
  heroContent: {
    paddingHorizontal: Spacing.xs,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.ivoryMist,
    marginTop: Spacing.xs,
  },
  heroSubtitle: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cancelWrapper: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
  mbSm: {
    marginBottom: Spacing.xs + 2,
  },
  mbMd: {
    marginBottom: Spacing.sm + 2,
  },
});

export default LoadingState;
