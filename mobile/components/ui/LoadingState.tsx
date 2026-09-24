import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import Button from './Button';

export interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Processing...',
  subtitle = 'Travel AI is analyzing geographic clues and candidate landmarks.',
  onCancel,
  cancelLabel = 'Cancel',
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for loading indicator container
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Stage transition fade
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [title, fadeAnim]);

  return (
    <View style={[styles.container, style]} accessible={true} accessibilityRole="progressbar">
      <View style={styles.card}>
        <Animated.View style={[styles.spinnerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator size="large" color={Colors.surfaceDark} />
        </Animated.View>

        <Text style={styles.label}>LIVE ANALYSIS</Text>

        <Animated.View style={[styles.textWrapper, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>

        {onCancel && (
          <View style={styles.actionContainer}>
            <Button
              title={cancelLabel}
              variant="outline"
              size="sm"
              onPress={onCancel}
              accessibilityLabel={cancelLabel}
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
    backgroundColor: Colors.canvas,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  spinnerContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  textWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs + 2,
  },
  subtitle: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
});

export default LoadingState;
