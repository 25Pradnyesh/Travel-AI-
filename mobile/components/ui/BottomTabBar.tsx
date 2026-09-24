import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { hapticFeedback } from '@/lib/haptics';

export interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

type TabIconName = 'sparkles' | 'sparkles-outline' | 'compass' | 'compass-outline' | 'bookmark' | 'bookmark-outline' | 'person' | 'person-outline';

interface TabConfig {
  label: string;
  activeIcon: TabIconName;
  inactiveIcon: TabIconName;
  isPrimary?: boolean;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    label: 'Analyze',
    activeIcon: 'sparkles',
    inactiveIcon: 'sparkles-outline',
    isPrimary: true,
  },
  explore: {
    label: 'Explore',
    activeIcon: 'compass',
    inactiveIcon: 'compass-outline',
  },
  saved: {
    label: 'Saved',
    activeIcon: 'bookmark',
    inactiveIcon: 'bookmark-outline',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name] || {
            label: route.name,
            activeIcon: 'compass',
            inactiveIcon: 'compass-outline',
          };

          const onPress = () => {
            if (!isFocused) {
              hapticFeedback.selection();
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = isFocused ? config.activeIcon : config.inactiveIcon;
          const activeColor = Colors.surfaceDark;
          const inactiveColor = Colors.textMuted;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.tabItemPressed,
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  config.isPrimary && isFocused && styles.primaryFocusedWrapper,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={config.isPrimary ? 22 : 20}
                  color={isFocused ? activeColor : inactiveColor}
                />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelFocused : styles.tabLabelUnfocused,
                  config.isPrimary && isFocused && styles.primaryTabLabelFocused,
                ]}
              >
                {config.label}
              </Text>

              {isFocused && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.canvas,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.minHeight,
    paddingVertical: 2,
    position: 'relative',
  },
  tabItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  primaryFocusedWrapper: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelUnfocused: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  primaryTabLabelFocused: {
    color: Colors.surfaceDark,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceDark,
    marginTop: 3,
  },
});

export default BottomTabBar;
