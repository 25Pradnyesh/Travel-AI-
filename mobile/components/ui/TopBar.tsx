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
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
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
  transparent = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.xs },
        !transparent && styles.borderBottom,
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
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
            </Pressable>
          ) : brandTitle ? (
            <Text style={styles.brandText}>{brandTitle}</Text>
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
    backgroundColor: Colors.canvas,
    zIndex: 10,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  contentRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
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
  backButton: {
    width: TouchTarget.minWidth,
    height: TouchTarget.minHeight,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brandText: {
    ...Typography.h2,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  titleText: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

export default TopBar;
