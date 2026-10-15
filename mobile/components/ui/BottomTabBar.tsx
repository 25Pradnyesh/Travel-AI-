import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { GlassView } from './GlassView';
import { hapticFeedback } from '@/lib/haptics';

export interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

type TabIconName =
  | 'sparkles'
  | 'sparkles-outline'
  | 'compass'
  | 'compass-outline'
  | 'bookmark'
  | 'bookmark-outline';

interface TabConfig {
  name: string;
  label: string;
  activeIcon: TabIconName;
  inactiveIcon: TabIconName;
  isCenterPrimary?: boolean;
}

// 3 floating tabs: Saved · Analyze (center filled Onyx) · Explore
const ORDERED_TABS: TabConfig[] = [
  {
    name: 'saved',
    label: 'Saved',
    activeIcon: 'bookmark',
    inactiveIcon: 'bookmark-outline',
  },
  {
    name: 'index',
    label: 'Analyze',
    activeIcon: 'sparkles',
    inactiveIcon: 'sparkles-outline',
    isCenterPrimary: true,
  },
  {
    name: 'explore',
    label: 'Explore',
    activeIcon: 'compass',
    inactiveIcon: 'compass-outline',
  },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.floatingContainer,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
      pointerEvents="box-none"
    >
      <GlassView
        borderRadius={Radius.pill}
        intensity={75}
        variant="dark"
        style={styles.glassPill}
      >
        <View style={styles.tabRow}>
          {ORDERED_TABS.map((tab) => {
            // Find the matching route in state.routes
            const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
            if (routeIndex === -1) return null;

            const route = state.routes[routeIndex];
            const isFocused = state.index === routeIndex;
            const { options } = descriptors[route.key];

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

            const iconName = isFocused ? tab.activeIcon : tab.inactiveIcon;

            // Center primary tab (Analyze) has special filled Onyx pill when active
            if (tab.isCenterPrimary) {
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel || tab.label}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.centerTabItem,
                    isFocused && styles.centerTabItemActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={17}
                    color={isFocused ? Colors.ivoryMist : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.centerLabel,
                      isFocused ? styles.centerLabelActive : styles.centerLabelInactive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || tab.label}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={18}
                  color={isFocused ? Colors.ivoryMist : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  glassPill: {
    width: '100%',
    maxWidth: 360,
    height: 60,
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    height: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minWidth: TouchTarget.minWidth,
  },
  centerTabItem: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    gap: 6,
    paddingHorizontal: Spacing.base,
  },
  centerTabItemActive: {
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.35)',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    marginTop: 2,
  },
  tabLabelInactive: {
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.ivoryMist,
    fontFamily: Fonts.sansSemiBold,
  },
  centerLabel: {
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
  },
  centerLabelInactive: {
    color: Colors.textSecondary,
  },
  centerLabelActive: {
    color: Colors.ivoryMist,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

export default BottomTabBar;
