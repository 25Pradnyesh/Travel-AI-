import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/components/ui/BottomTabBar';
import { Colors } from '@/constants/theme';

const renderTabBar = (props: any) => <BottomTabBar {...props} />;

export default function TabLayout() {
  return (
    <Tabs
      tabBar={renderTabBar}
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
    </Tabs>
  );
}
