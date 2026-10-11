import React from 'react';
import { Stack } from 'expo-router';
import { OfflineScreen } from '@/components/ui';

export default function OfflineRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Offline',
          headerShown: false,
          animation: 'fade',
        }}
      />
      <OfflineScreen />
    </>
  );
}
