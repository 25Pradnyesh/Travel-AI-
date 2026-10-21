/**
 * VAMO Mobile — DEV Auth Fixtures Bar
 *
 * Rendered on Login and Profile in __DEV__ to test and verify all auth presentation states:
 * - 'real': Live Supabase credentials
 * - 'guest': Guest mode (unauthenticated)
 * - 'signed-in': Authenticated with mock profile (Alex Rivera, alex.traveler@example.com)
 * - 'loading': Authenticating / spinner state
 * - 'error': Failed OAuth state
 * - 'unavailable': Host unreachable / sign-in unavailable state
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/supabase';
import { MockAuthState } from '@/lib/supabase/mock-auth';
import { hapticFeedback } from '@/lib/haptics';

const FIXTURE_OPTIONS: { label: string; state: MockAuthState; icon: any }[] = [
  { label: 'Real', state: 'real', icon: 'flash-outline' },
  { label: 'Guest', state: 'guest', icon: 'person-outline' },
  { label: 'Signed In', state: 'signed-in', icon: 'checkmark-circle-outline' },
  { label: 'Loading', state: 'loading', icon: 'hourglass-outline' },
  { label: 'Error', state: 'error', icon: 'alert-circle-outline' },
  { label: 'Unavailable', state: 'unavailable', icon: 'cloud-offline-outline' },
];

export const DevAuthFixtures: React.FC = () => {
  const { mockState, setMockState } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!__DEV__) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="construct-outline" size={12} color={Colors.racingRed} />
          <Text style={styles.titleText}>__DEV__ AUTH FIXTURES</Text>
        </View>
        <Pressable
          onPress={() => setCollapsed(!collapsed)}
          hitSlop={8}
          style={styles.collapseToggle}
        >
          <Text style={styles.collapseText}>{collapsed ? 'Show' : 'Hide'}</Text>
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={12}
            color={Colors.textMuted}
          />
        </Pressable>
      </View>

      {!collapsed && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.buttonsRow}
        >
          {FIXTURE_OPTIONS.map((opt) => {
            const isActive = mockState === opt.state;
            return (
              <Pressable
                key={opt.state}
                onPress={() => {
                  hapticFeedback.selection();
                  setMockState(opt.state);
                }}
                style={[
                  styles.optionPill,
                  isActive && styles.optionPillActive,
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={12}
                  color={isActive ? Colors.ivoryMist : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.optionText,
                    isActive && styles.optionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(12, 18, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(235, 38, 39, 0.35)',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  titleText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.racingRed,
  },
  collapseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  collapseText: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.textMuted,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 244, 227, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.15)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optionPillActive: {
    backgroundColor: 'rgba(235, 38, 39, 0.25)',
    borderColor: Colors.racingRed,
  },
  optionText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: Colors.ivoryMist,
    fontFamily: Fonts.sansSemiBold,
  },
});

export default DevAuthFixtures;
