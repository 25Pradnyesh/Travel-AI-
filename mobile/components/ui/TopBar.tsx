import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  brandTitle?: string;
  style?: StyleProp<ViewStyle>;
  transparent?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showBack = false,
  onBackPress,
  rightAction,
  brandTitle,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, Spacing.base) },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftContainer}>
          {showBack && onBackPress ? (
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                onBackPress();
              }}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [styles.frostedBackPill, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.ivoryMist} />
            </Pressable>
          ) : brandTitle ? (
            <View style={styles.brandPill}>
              <Text style={styles.brandText}>{brandTitle}</Text>
              <View style={styles.brandDot} />
            </View>
          ) : null}
        </View>

        {title ? (
          <View style={styles.centerContainer}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : null}

        <View style={styles.rightContainer}>{rightAction}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    zIndex: 20,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  contentRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    minWidth: TouchTarget.minWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  rightContainer: {
    minWidth: TouchTarget.minWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  frostedBackPill: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.glassFrostedBg,
    borderWidth: 1,
    borderColor: Colors.glassFrostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.ivoryMist,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.racingRed,
  },
  titleText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.ivoryMist,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

export default TopBar;
