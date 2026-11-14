import { RADIUS } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

interface PlayerAvatarProps {
  name: string;
  color: string;
  size?: number;
}

export function PlayerAvatar({ name, color, size = 36 }: PlayerAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: RADIUS.sm,
          backgroundColor: `${color}33`,
          borderColor: `${color}66`,
        },
      ]}
      accessible={false}
    >
      <Text
        style={[styles.initial, { color, fontSize: Math.round(size * 0.44) }]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    fontWeight: "700",
  },
});
