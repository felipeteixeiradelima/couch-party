import { COLORS } from "@/constants/theme";
import { PlayersProvider } from "@/contexts/PlayersContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: COLORS.background }}>
      <PlayersProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="players" />
          <Stack.Screen
            name="rules"
            options={{ presentation: "modal", animation: "fade_from_bottom" }}
          />
          <Stack.Screen name="games/impostor" />
          <Stack.Screen name="games/cidade-dorme" />
          <Stack.Screen name="games/perguntas" />
        </Stack>
      </PlayersProvider>
    </SafeAreaProvider>
  );
}
