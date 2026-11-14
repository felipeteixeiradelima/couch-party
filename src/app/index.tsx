import { GameCard } from "@/components/games/GameCard";
import { Button } from "@/components/ui/Button";
import { GAMES } from "@/constants/games";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { usePlayers } from "@/hooks/usePlayers";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { players } = usePlayers();

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
                color={COLORS.white}
              />
            </View>
            <Text style={styles.brandTitle}>Couch Party!</Text>
          </View>

          <Pressable
            onPress={() => router.push("/rules")}
            accessibilityRole="button"
            accessibilityLabel="Abrir regras dos jogos"
            style={({ pressed }) => [
              styles.rulesButton,
              pressed && styles.rulesButtonPressed,
            ]}
          >
            <Ionicons
              name="help-circle-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.rulesButtonText}>Regras</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>A NOITE COMEÇA AQUI</Text>
            <Text style={styles.heading}>Escolha o jogo</Text>
            <Text style={styles.subtitle}>
              Reúna a turma. O resto é com a gente.
            </Text>
          </View>

          <View style={styles.cardsList}>
            {GAMES.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => router.push(game.route)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={playersButtonLabel}
            onPress={() => router.push("/players")}
            icon={
              <Ionicons name="people-outline" size={20} color={COLORS.white} />
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  rulesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 38,
  },
  rulesButtonPressed: {
    backgroundColor: COLORS.surfaceElevated,
  },
  rulesButtonText: {
    color: COLORS.textPrimary,
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
    color: COLORS.primaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: SPACING.xs,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
});
