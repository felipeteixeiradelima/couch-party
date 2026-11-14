import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { GAMES } from "@/constants/games";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RulesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader title="Regras" subtitle="Como funciona o Couch Party" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introHeader}>
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color={COLORS.primaryText}
            />
            <Text style={styles.introTitle}>Um celular, toda a turma</Text>
          </View>
          <Text style={styles.introText}>
            Configure os jogadores uma única vez e passe o celular de mão em mão
            quando o jogo pedir para revelar papéis ou perguntas secretas.
          </Text>
        </View>

        {GAMES.map((game) => (
          <View key={game.id} style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gamePlayers}>
                {game.minPlayers}–{game.maxPlayers} jogadores
              </Text>
            </View>

            <View style={styles.rulesList}>
              {game.rulesSummary.map((rule, index) => (
                <View key={rule} style={styles.ruleRow}>
                  <Text style={[styles.ruleIndex, { color: game.accentColor }]}>
                    {index + 1}.
                  </Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  introCard: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(139, 61, 255, 0.35)",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  introTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  introText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  gameCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  gameTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  gamePlayers: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  rulesList: {
    gap: SPACING.sm,
  },
  ruleRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  ruleIndex: {
    fontSize: 14,
    fontWeight: "700",
    width: 18,
  },
  ruleText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
