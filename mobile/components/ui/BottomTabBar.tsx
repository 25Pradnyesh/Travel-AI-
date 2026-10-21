import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
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
            const iconColor = isFocused ? Colors.ivoryMist : 'rgba(251, 244, 227, 0.85)';

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || tab.label}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  isFocused && styles.tabItemActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={16}
                  color={iconColor}
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
    height: 56,
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 14, 18, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.16)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs + 2,
    height: '100%',
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: Radius.pill,
    gap: 6,
    paddingHorizontal: Spacing.xs,
  },
  tabItemActive: {
    backgroundColor: Colors.onyx,
    borderWidth: 1,
    borderColor: 'rgba(251, 244, 227, 0.35)',
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: Fonts.sansSemiBold,
    letterSpacing: 0.1,
  },
  tabLabelInactive: {
    color: 'rgba(251, 244, 227, 0.85)',
  },
  tabLabelActive: {
    color: Colors.ivoryMist,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

export default BottomTabBar;
