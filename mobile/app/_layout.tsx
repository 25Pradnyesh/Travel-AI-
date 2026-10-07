import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/supabase';
import { SplashVideo } from '@/components/SplashVideo';

// Keep native Android splash screen visible until splash video is ready to play
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [showSplashVideo, setShowSplashVideo] = useState(true);

  useEffect(() => {
    // If the app was opened via OAuth deep link or auth callback, skip splash video immediately
    Linking.getInitialURL()
      .then((url) => {
        if (url && (url.includes('auth/callback') || url.includes('travelai://auth'))) {
          setShowSplashVideo(false);
          SplashScreen.hideAsync().catch(() => {});
        }
      })
      .catch(() => {});
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.canvas },
            animation: 'fade_from_bottom',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(auth)/login"
            options={{
              presentation: 'modal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="auth/callback"
            options={{
              presentation: 'modal',
              headerShown: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="analyze/processing"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="analyze/results"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="analyze/map"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="place/[id]"
            options={{
              presentation: 'modal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="history/index"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="history/[id]"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        {showSplashVideo && (
          <SplashVideo onFinish={() => setShowSplashVideo(false)} />
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}
