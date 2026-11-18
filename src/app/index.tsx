import { GameCard } from "@/components/games/GameCard";
import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { Button } from "@/components/ui/Button";
import { GAMES } from "@/constants/games";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import { usePlayers } from "@/hooks/usePlayers";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { players } = usePlayers();
  const { triggerLightImpact } = useHaptics();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const playersButtonLabel =
    players.length > 0
      ? `Configurar Jogadores (${players.length})`
      : "Configurar Jogadores";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoBox} accessible={false}>
              <MaterialCommunityIcons
                name="sofa-outline"
                size={22}
                color={colors.white}
              />
            </View>
            <Text style={styles.brandTitle}>Couch Party!</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                triggerLightImpact();
                router.push("/rules");
              }}
              accessibilityRole="button"
              accessibilityLabel="Abrir regras dos jogos"
              style={({ pressed }) => [
                styles.rulesButton,
                pressed && styles.headerButtonPressed,
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.rulesButtonText}>Regras</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerLightImpact();
                router.push("/settings");
              }}
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações do aplicativo"
              style={({ pressed }) => [
                styles.settingsButton,
                pressed && styles.headerButtonPressed,
              ]}
              hitSlop={6}
            >
              <Ionicons
                name="settings-outline"
                size={19}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AnimatedPhaseView variant="fade-up" duration={260}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>A NOITE COMEÇA AQUI</Text>
              <Text style={styles.heading}>Escolha o jogo</Text>
              <Text style={styles.subtitle}>
                Reúna a turma. O resto é com a gente.
              </Text>
            </View>
          </AnimatedPhaseView>

          <View style={styles.cardsList}>
            {GAMES.map((game, index) => (
              <AnimatedPhaseView
                key={game.id}
                variant="fade-up"
                delay={60 + index * 55}
                duration={260}
              >
                <GameCard
                  game={game}
                  onPress={() => {
                    triggerLightImpact();
                    router.push(game.route);
                  }}
                />
              </AnimatedPhaseView>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={playersButtonLabel}
            onPress={() => {
              triggerLightImpact();
              router.push("/players");
            }}
            icon={
              <Ionicons name="people-outline" size={20} color={colors.white} />
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      flexShrink: 1,
    },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    brandTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    rulesButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: 40,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerButtonPressed: {
      backgroundColor: colors.surfaceElevated,
    },
    rulesButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
    },
    hero: {
      marginBottom: SPACING.xl,
    },
    eyebrow: {
      color: colors.primaryText,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.4,
      marginBottom: SPACING.xs,
    },
    heading: {
      color: colors.textPrimary,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    cardsList: {
      gap: SPACING.lg,
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
  });
