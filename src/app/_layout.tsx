import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { DATABASE_NAME, initializeDatabase } from "@/database";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RootNavigator() {
  const { animationsEnabled } = useAppSettings();
  const theme = useTheme();

  return (
    <SafeAreaProvider
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <StatusBar style={theme.isDark ? "light" : "dark"} />
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

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      <AppSettingsProvider>
        <PlayersProvider>
          <RootNavigator />
        </PlayersProvider>
      </AppSettingsProvider>
    </SQLiteProvider>
  );
}
