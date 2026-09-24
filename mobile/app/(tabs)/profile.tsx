import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TopBar } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { travelAiApi } from '@/lib/api/travel-ai';
import { apiClient } from '@/lib/api/client';
import { EngineHealthResponse } from '@/types/analysis';
import { hapticFeedback } from '@/lib/haptics';

export default function ProfileScreen() {
  const [preferredMap, setPreferredMap] = useState<'apple' | 'google'>('google');
  const [health, setHealth] = useState<EngineHealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const checkEngineHealth = async () => {
    hapticFeedback.light();
    setIsCheckingHealth(true);
    setHealthError(null);
    if (!apiClient.getBaseUrl()) {
      setHealthError('Not Configured');
      setIsCheckingHealth(false);
      return;
    }
    try {
      const res = await travelAiApi.checkHealth();
      setHealth(res);
    } catch {
      setHealthError('Unreachable');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkEngineHealth();
  }, []);

  const isEngineOnline = health?.status === 'ok';
  const isPlacesReady = Boolean(health?.configuration?.google_places_ready);
  const isGeminiReady = Boolean(health?.configuration?.gemini_ready);

  return (
    <View style={styles.screen}>
      <TopBar brandTitle="Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation & Maps Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>PREFERENCES</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconWrapper}>
                <Ionicons name="map-outline" size={18} color={Colors.textPrimary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Default Navigation App</Text>
                <Text style={styles.rowSubtitle}>App launched for directions</Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setPreferredMap('apple');
                }}
                style={[
                  styles.toggleButton,
                  preferredMap === 'apple' && styles.toggleButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set Apple Maps as default"
              >
                <Text
                  style={[
                    styles.toggleText,
                    preferredMap === 'apple' && styles.toggleTextActive,
                  ]}
                >
                  Apple Maps
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setPreferredMap('google');
                }}
                style={[
                  styles.toggleButton,
                  preferredMap === 'google' && styles.toggleButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set Google Maps as default"
              >
                <Text
                  style={[
                    styles.toggleText,
                    preferredMap === 'google' && styles.toggleTextActive,
                  ]}
                >
                  Google Maps
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Engine Diagnostics */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionEyebrow}>SYSTEM DIAGNOSTICS</Text>
            <Pressable
              onPress={checkEngineHealth}
              disabled={isCheckingHealth}
              hitSlop={8}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Text style={styles.refreshText}>
                {isCheckingHealth ? 'Checking...' : 'Refresh'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isEngineOnline ? Colors.verified : Colors.error,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>FastAPI Engine Boundary</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  !isEngineOnline && styles.diagnosticValueWarning,
                ]}
              >
                {healthError ? 'Unreachable' : isEngineOnline ? 'Online (200 OK)' : 'Degraded'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isPlacesReady ? Colors.verified : Colors.textMuted,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>Google Places Service</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  !isPlacesReady && styles.diagnosticValueMuted,
                ]}
              >
                {isPlacesReady ? 'Ready' : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isGeminiReady ? Colors.verified : Colors.textMuted,
                    },
                  ]}
                />
                <Text style={styles.diagnosticName}>Gemini Multimodal Vision</Text>
              </View>
              <Text
                style={[
                  styles.diagnosticValue,
                  !isGeminiReady && styles.diagnosticValueMuted,
                ]}
              >
                {isGeminiReady ? 'Ready' : 'Not Configured'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.diagnosticItem}>
              <View style={styles.diagnosticLeft}>
                <Ionicons name="link-outline" size={14} color={Colors.textMuted} style={styles.metaIcon} />
                <Text style={styles.metaLabel}>Configured Base URL</Text>
              </View>
              <Text style={styles.metaValue} numberOfLines={1}>
                {apiClient.getBaseUrl() || 'Not Configured (Production)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Application Information */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ABOUT TRAVEL AI</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0 (Phase 2 Mobile Engine)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Client Stack</Text>
              <Text style={styles.infoValue}>React Native · Expo Router · TypeScript</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Analysis Timeout</Text>
              <Text style={styles.infoValue}>180s (Deep Video & Places)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs + 2,
  },
  sectionEyebrow: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textMuted,
  },
  refreshText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  rowSubtitle: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  toggleButtonActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  toggleText: {
    ...Typography.bodySmall,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  diagnosticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
  },
  diagnosticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  diagnosticName: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  diagnosticValue: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.verified,
  },
  diagnosticValueWarning: {
    color: Colors.error,
  },
  diagnosticValueMuted: {
    color: Colors.textMuted,
  },
  metaIcon: {
    marginRight: Spacing.xs,
  },
  metaLabel: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textMuted,
  },
  metaValue: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    maxWidth: 160,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceSubtle,
    marginVertical: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textMuted,
  },
  infoValue: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.6,
  },
});
