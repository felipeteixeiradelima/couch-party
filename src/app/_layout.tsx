import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { PlayersProvider } from '@/contexts/PlayersContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PlayersProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="players" />
          <Stack.Screen
            name="rules"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="games/impostor" />
          <Stack.Screen name="games/cidade-dorme" />
          <Stack.Screen name="games/perguntas" />
        </Stack>
      </PlayersProvider>
    </SafeAreaProvider>
  );
}
