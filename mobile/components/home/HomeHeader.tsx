import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';
import { DemoModePill } from '@/components/ui/DemoModePill';
import { useDemoMode } from '@/lib/demo/demo-mode';
import { logTap } from '@/lib/dev/tap-logger';

export interface HomeHeaderProps {
  onPressHistory?: () => void;
  onPressProfile?: () => void;
  userName?: string | null;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onPressHistory,
  onPressProfile,
  userName,
}) => {
  const insets = useSafeAreaInsets();
  const { isRecordingMode } = useDemoMode();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.base) }]}>
      <View style={styles.contentRow}>
        {/* Brand Wordmark & Demo Mode Pill */}
        <View style={styles.leftRow}>
          <View style={styles.brandPill}>
            <Text style={styles.brandText}>VAMO</Text>
          </View>
          <DemoModePill />
        </View>

        {/* Right Actions: DEV Sink, History toggle, Avatar */}
        <View style={styles.actionsRow}>
          {/* Dev-only shortcuts */}
          {Boolean(__DEV__ && !isRecordingMode) && (
            <>
              <Pressable
                onPress={() => {
                  logTap('HomeHeader:Photos');
                  hapticFeedback.selection();
                  router.push('/dev/backgrounds' as any);
                }}
                hitSlop={6}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Open Background Photos Harness"
                style={({ pressed }) => [styles.devPill, pressed && styles.pressed]}
              >
                <Ionicons name="images-outline" size={12} color={Colors.icyBlue} />
                <Text style={styles.devPillText}>Photos</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  logTap('HomeHeader:UISink');
                  hapticFeedback.selection();
                  router.push('/dev/kitchen-sink' as any);
                }}
                hitSlop={6}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Open UI Kitchen Sink"
                style={({ pressed }) => [styles.devPill, pressed && styles.pressed]}
              >
                <Ionicons name="sparkles" size={12} color={Colors.icyBlue} />
                <Text style={styles.devPillText}>UI Sink</Text>
              </Pressable>
            </>
          )}

          {/* Profile Avatar Shortcut */}
          {onPressProfile && (
            <Pressable
              onPress={() => {
                logTap('HomeHeader:ProfileAvatar');
                hapticFeedback.light();
                onPressProfile();
              }}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={userName ? `Profile for ${userName}` : 'Profile and settings'}
              style={({ pressed }) => [styles.avatarAction, pressed && styles.pressed]}
            >
              <Ionicons name="person" size={15} color={Colors.ivoryMist} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: Spacing.sm,

  },

  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  brandText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    letterSpacing: 2.2,
    color: Colors.ivoryMist,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(166, 220, 248, 0.40)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    gap: 4,
    minHeight: 34,
  },
  devPillText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.icyBlue,
  },
  circleAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 18, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.onyx,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 244, 227, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

export default HomeHeader;
