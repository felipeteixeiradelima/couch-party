import { TeamSplashScreen } from "@/components/ui/TeamSplashScreen";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { DATABASE_NAME, initializeDatabase } from "@/database";
import { useAppSettings } from "@/hooks/useAppSettings";
import { usePlayers } from "@/hooks/usePlayers";
import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors in environments where native splash control is unavailable.
});

function StartupReadyObserver({ onReady }: { onReady: () => void }) {
  const { isHydrated } = usePlayers();
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    if (isHydrated && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onReady();
    }
  }, [isHydrated, onReady]);

  return null;
}

function RootNavigator() {
  const { animationsEnabled } = useAppSettings();
  const theme = useTheme();

  return (
    <SafeAreaProvider
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: animationsEnabled ? "slide_from_right" : "none",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="players" />
        <Stack.Screen
          name="rules"
          options={{
            presentation: "modal",
            animation: animationsEnabled ? "fade_from_bottom" : "none",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            animation: animationsEnabled ? "slide_from_right" : "none",
          }}
        />
        <Stack.Screen name="games/impostor" />
        <Stack.Screen name="games/cidade-dorme" />
        <Stack.Screen name="games/perguntas" />
      </Stack>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isHydrated: isSettingsHydrated } = useAppSettings();
  const theme = useTheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  const handleNativeSplashHide = useCallback(() => {
    void SplashScreen.hideAsync().catch(() => {
      // Ignore if native splash was already hidden or unsupported.
    });
  }, []);

  const handleAppReady = useCallback(() => {
    setIsAppReady(true);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setIsSplashFinished(true);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {isSettingsHydrated ? (
        <StatusBar style={theme.isDark ? "light" : "dark"} />
      ) : null}

      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
        <PlayersProvider>
          <StartupReadyObserver onReady={handleAppReady} />
          <RootNavigator />
        </PlayersProvider>
      </SQLiteProvider>

      {isSettingsHydrated && !isSplashFinished ? (
        <TeamSplashScreen
          isAppReady={isAppReady}
          onReadyToDisplay={handleNativeSplashHide}
          onFinish={handleSplashFinish}
        />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppSettingsProvider>
      <AppContent />
    </AppSettingsProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
