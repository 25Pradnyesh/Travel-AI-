/**
 * Travel AI Mobile — OAuth Callback Screen (Stage 3)
 *
 * Fallback route for handling OAuth deep-link redirects when opened directly
 * by the operating system (e.g. `travelai://auth/callback`).
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { handleAuthRedirect } from '@/lib/supabase';
import { hapticFeedback } from '@/lib/haptics';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('auth/callback')) {
          await handleAuthRedirect(initialUrl);
          if (isMounted) {
            setStatus('success');
            hapticFeedback.success();
            setTimeout(() => {
              router.replace('/(tabs)/profile');
            }, 800);
            return;
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Authentication verification failed.';
          setErrorMessage(msg);
          setStatus('error');
        }
      }
    };

    processInitialUrl();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleReturnHome = () => {
    hapticFeedback.light();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'verifying' && (
          <>
            <ActivityIndicator size="large" color={Colors.surfaceDark} style={styles.spinner} />
            <Text style={styles.title}>Completing Sign-In</Text>
            <Text style={styles.subtitle}>
              Securing credentials and establishing your Travel AI cloud session...
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.verified} />
            </View>
            <Text style={styles.title}>Welcome to Travel AI</Text>
            <Text style={styles.subtitle}>Your Google account has been connected successfully.</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={styles.errorIconWrapper}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
            </View>
            <Text style={styles.title}>Authentication Failed</Text>
            <Text style={styles.subtitle}>
              {errorMessage || 'Unable to complete sign-in. You may continue exploring as a guest.'}
            </Text>

            <Pressable
              onPress={handleReturnHome}
              style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Return to home screen"
            >
              <Text style={styles.returnButtonText}>Return to App</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  spinner: {
    marginBottom: Spacing.lg,
  },
  successIconWrapper: {
    marginBottom: Spacing.md,
  },
  errorIconWrapper: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  returnButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.canvas,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
