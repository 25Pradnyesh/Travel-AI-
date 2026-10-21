import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/supabase';
import { AtmosphereProvider } from '@/context/AtmosphereContext';
import { NetworkProvider } from '@/hooks/useNetwork';
import { OfflineGuard } from '@/components/ui/OfflineGuard';
import { GlobalToast } from '@/components/ui/Toast';
import { SplashVideo } from '@/components/SplashVideo';
import { RootAtmosphereBackground } from '@/components/ui/RootAtmosphereBackground';

const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
  },
};

// Keep native splash screen visible until fonts and assets are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    'InstrumentSerif-Regular': InstrumentSerif_400Regular,
    'InstrumentSerif-Italic': InstrumentSerif_400Regular_Italic,
  });

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

  // Hold UI until typography fonts are hydrated
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <AtmosphereProvider>
            <StatusBar style="light" />
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
              <RootAtmosphereBackground />
              <ThemeProvider value={navigationDarkTheme}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
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
                  <Stack.Screen
                    name="dev/kitchen-sink"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="dev/atmosphere"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="dev/backgrounds"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="dev/results-fixtures"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="offline"
                    options={{
                      headerShown: false,
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="profile"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="+not-found"
                    options={{
                      headerShown: false,
                      animation: 'fade',
                    }}
                  />
                </Stack>
              </ThemeProvider>
              <OfflineGuard />
              <GlobalToast />
              {showSplashVideo && (
                <SplashVideo onFinish={() => setShowSplashVideo(false)} />
              )}
            </View>
          </AtmosphereProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
