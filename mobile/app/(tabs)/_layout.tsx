import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.canvas },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Analyze',
          tabBarAccessibilityLabel: 'Analyze Tab',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore Tab',
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarAccessibilityLabel: 'Saved Places Tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile and Settings Tab',
        }}
      />
    </Tabs>
  );
}
