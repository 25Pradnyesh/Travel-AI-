import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import PillButton from './PillButton';

export type ErrorStateVariant = 'network' | 'engine' | 'generic';

export interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  variant = 'generic',
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  onCancel,
  cancelLabel = 'Go Back',
  style,
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'network':
        return {
          icon: <Ionicons name="cloud-offline-outline" size={26} color={Colors.partial} />,
          eyebrow: 'NETWORK OFFLINE',
          eyebrowColor: Colors.partial,
          iconBg: Colors.partialSurface,
          iconBorder: Colors.partialBorder,
          defaultTitle: 'Connection Offline',
          defaultMessage: 'Check your Wi-Fi or cellular connection and try again.',
        };
      case 'engine':
        return {
          icon: <Ionicons name="server-outline" size={26} color={Colors.partial} />,
          eyebrow: 'ENGINE STATUS',
          eyebrowColor: Colors.partial,
          iconBg: Colors.partialSurface,
          iconBorder: Colors.partialBorder,
          defaultTitle: 'Engine Unreachable',
          defaultMessage: 'VAMO engine is taking longer to respond. Please retry in a moment.',
        };
      default:
        return {
          icon: <Ionicons name="alert-circle-outline" size={26} color={Colors.textSecondary} />,
          eyebrow: 'NOTICE',
          eyebrowColor: Colors.textMuted,
          iconBg: Colors.glassFrostedBg,
          iconBorder: Colors.glassFrostedBorder,
          defaultTitle: 'Analysis Unavailable',
          defaultMessage: "VAMO couldn't complete the analysis. Please check the Reel URL and try again.",
        };
    }
  };

  const config = getVariantConfig();
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <View style={[styles.container, style]} accessible={true} accessibilityRole="alert">
      <View style={styles.card}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: config.iconBg,
              borderColor: config.iconBorder,
            },
          ]}
        >
          {config.icon}
        </View>

        <Text style={[styles.eyebrow, { color: config.eyebrowColor }]}>
          {config.eyebrow}
        </Text>

        <Text style={styles.title}>{displayTitle}</Text>
        <Text style={styles.message}>{displayMessage}</Text>

        {(onRetry || onCancel) && (
          <View style={styles.buttonRow}>
            {onCancel && (
              <PillButton
                title={cancelLabel}
                variant="glass"
                size="md"
                onPress={onCancel}
                style={styles.actionBtn}
                accessibilityLabel={cancelLabel}
              />
            )}
            {onRetry && (
              <PillButton
                title={retryLabel}
                variant="primary"
                size="md"
                onPress={onRetry}
                style={styles.actionBtn}
                accessibilityLabel={retryLabel}
              />
            )}
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  eyebrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
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
  message: {
    fontFamily: Fonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    width: '100%',
  },
  actionBtn: {
    minWidth: 110,
  },
});

export default ErrorState;
