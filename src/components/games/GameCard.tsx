import { getGameVisuals } from "@/constants/games";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { GameId, GameMetadata } from "@/types/game";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface GameCardProps {
  game: GameMetadata;
  onPress: () => void;
}

function renderGameIcon(id: GameId, color: string) {
  switch (id) {
    case "impostor":
      return (
        <MaterialCommunityIcons name="drama-masks" size={24} color={color} />
      );
    case "cidade-dorme":
      return <Ionicons name="moon-outline" size={22} color={color} />;
    case "perguntas":
      return <Ionicons name="help-circle-outline" size={24} color={color} />;
  }
}

export function GameCard({ game, onPress }: GameCardProps) {
  const { animationsEnabled } = useAppSettings();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const visuals = getGameVisuals(game.id, theme);
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const animateScale = (toValue: number) => {
    if (!animationsEnabled) {
      scaleAnim.setValue(1);
      return;
    }

    Animated.spring(scaleAnim, {
      toValue,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateScale(0.98)}
        onPressOut={() => animateScale(1)}
        accessibilityRole="button"
        accessibilityLabel={`${game.title}, ${game.minPlayers} a ${game.maxPlayers} jogadores. ${game.description}`}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.topRow}>
          <View
            style={[styles.iconBox, { backgroundColor: visuals.iconBgColor }]}
            accessible={false}
          >
            {renderGameIcon(game.id, visuals.accentColor)}
          </View>

          <View style={styles.badge}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.badgeText}>
              {game.minPlayers}–{game.maxPlayers} jogadores
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{game.title}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.description}>{game.description}</Text>

          <View style={styles.chevronBox} accessible={false}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.xl,
    },
    cardPressed: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.primary,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.lg,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surfaceElevated,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    badgeText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: SPACING.xs,
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: SPACING.md,
    },
    description: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    chevronBox: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
  });
