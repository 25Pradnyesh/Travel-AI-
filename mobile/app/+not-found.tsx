import React from 'react';
import { Stack } from 'expo-router';
import { NotFoundScreen } from '@/components/ui';

export default function NotFoundRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Not Found',
          headerShown: false,
          animation: 'fade',
        }}
      />
      <NotFoundScreen />
    </>
  );
}
