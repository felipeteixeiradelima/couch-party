import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { GAMES_BY_ID } from "@/constants/games";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { usePlayers } from "@/hooks/usePlayers";
import { GameCategorySummary, GameId, GameSettings } from "@/types/game";
import { clampImpostorCount, formatDurationLabel } from "@/utils/gameEngine";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface GameLobbySettingRow {
  label: string;
  value: string;
}

interface GameLobbyConfigProps {
  settings?: GameSettings;
  categories?: GameCategorySummary[];
  settingRows?: GameLobbySettingRow[];
  onOpenSettings: () => void;
  onStartGame: () => void;
}

interface GameLobbyTemplateProps {
  gameId: GameId;
  lobbyConfig?: GameLobbyConfigProps;
}

function getCategorySummaryLabel(
  settings: GameSettings,
  categories: GameCategorySummary[],
): string {
  if (settings.selectedCategoryIds.length === 0) {
    return "Aleatória (todas)";
  }

  const selectedNames = categories
    .filter((cat) => settings.selectedCategoryIds.includes(cat.id))
    .map((cat) => cat.name);

  if (selectedNames.length === 0) {
    return "Aleatória (todas)";
  }

  if (selectedNames.length === 1) {
    return selectedNames[0];
  }

  if (selectedNames.length === 2) {
    return `${selectedNames[0]} e ${selectedNames[1]}`;
  }

  return `${selectedNames.length} selecionadas (sorteio)`;
}

export function GameLobbyTemplate({
  gameId,
  lobbyConfig,
}: GameLobbyTemplateProps) {
  const { players } = usePlayers();
  const game = GAMES_BY_ID[gameId];

  const hasEnoughPlayers = players.length >= game.minPlayers;
  const hasTooManyPlayers = players.length > game.maxPlayers;
  const isReady = hasEnoughPlayers && !hasTooManyPlayers;

  const missingCount = Math.max(0, game.minPlayers - players.length);
  const excessCount = Math.max(0, players.length - game.maxPlayers);

  const settingRows: GameLobbySettingRow[] = lobbyConfig
    ? (lobbyConfig.settingRows ??
      (lobbyConfig.settings
        ? [
            {
              label: "Impostores",
              value: String(
                clampImpostorCount(
                  lobbyConfig.settings.impostorCount,
                  players.length,
                ),
              ),
            },
            {
              label: "Categoria",
              value: getCategorySummaryLabel(
                lobbyConfig.settings,
                lobbyConfig.categories ?? [],
              ),
            },
            {
              label: "Dica para o impostor",
              value: lobbyConfig.settings.hintEnabled
                ? "Ativada"
                : "Desativada",
            },
            {
              label: "Tempo de votação",
              value: lobbyConfig.settings.votingTimerEnabled
                ? formatDurationLabel(
                    lobbyConfig.settings.votingDurationSeconds,
                  )
                : "Desativado",
            },
          ]
        : []))
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScreenHeader
        title={game.title}
        subtitle={`${game.minPlayers}–${game.maxPlayers} jogadores`}
        rightSlot={
          lobbyConfig ? (
            <Pressable
              onPress={lobbyConfig.onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações do jogo"
              style={({ pressed }) => [
                styles.headerActionButton,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={COLORS.textPrimary}
              />
            </Pressable>
          ) : null
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.statusCard,
            isReady ? styles.statusReady : styles.statusWarning,
          ]}
        >
          <Ionicons
            name={isReady ? "checkmark-circle-outline" : "alert-circle-outline"}
            size={22}
            color={isReady ? COLORS.success : COLORS.warning}
          />
          <View style={styles.statusTextBlock}>
            <Text style={styles.statusTitle}>
              {isReady
                ? `${players.length} jogadores prontos`
                : hasTooManyPlayers
                  ? `Remova ${excessCount} jogador${excessCount > 1 ? "es" : ""}`
                  : `Adicione mais ${missingCount} jogador${missingCount > 1 ? "es" : ""}`}
            </Text>
            <Text style={styles.statusDescription}>
              {isReady
                ? "A quantidade de jogadores está dentro do ideal para começar."
                : `${game.title} aceita de ${game.minPlayers} a ${game.maxPlayers} jogadores.`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jogadores na partida</Text>
            <Text style={styles.sectionCount}>{players.length}</Text>
          </View>

          {players.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Nenhum jogador configurado ainda.
              </Text>
            </View>
          ) : (
            <View style={styles.playersGrid}>
              {players.map((player) => (
                <View key={player.id} style={styles.playerChip}>
                  <PlayerAvatar
                    name={player.name}
                    color={player.color}
                    size={28}
                  />
                  <Text style={styles.playerChipName} numberOfLines={1}>
                    {player.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {lobbyConfig ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Configurações do jogo</Text>
              <Pressable
                onPress={lobbyConfig.onOpenSettings}
                accessibilityRole="button"
                accessibilityLabel="Personalizar configurações do jogo"
                style={({ pressed }) => [
                  styles.editSettingsLink,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.editSettingsLinkText}>Personalizar</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={lobbyConfig.onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações da partida"
              style={({ pressed }) => [
                styles.settingsCard,
                pressed && styles.settingsCardPressed,
              ]}
            >
              {settingRows.map((row, index) => (
                <View key={row.label}>
                  {index > 0 ? <View style={styles.settingDivider} /> : null}
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>{row.label}</Text>
                    <Text style={styles.settingValue} numberOfLines={1}>
                      {row.value}
                    </Text>
                  </View>
                </View>
              ))}
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como jogar</Text>
          <View style={styles.rulesCard}>
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
      </ScrollView>

      <View style={styles.footer}>
        {!isReady ? (
          <Button
            label="Configurar Jogadores"
            onPress={() => router.push("/players")}
            icon={
              <Ionicons name="people-outline" size={20} color={COLORS.white} />
            }
          />
        ) : (
          <View style={styles.footerActions}>
            <Button
              label="Ajustar Jogadores"
              variant="secondary"
              onPress={() => router.push("/players")}
            />
            {lobbyConfig ? (
              <Button
                label="Iniciar Partida"
                onPress={lobbyConfig.onStartGame}
                icon={<Ionicons name="play" size={18} color={COLORS.white} />}
              />
            ) : (
              <Button
                label="Fluxo da partida em desenvolvimento"
                disabled
                onPress={() => {}}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.78,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  statusReady: {
    backgroundColor: COLORS.successSoft,
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  statusWarning: {
    backgroundColor: COLORS.warningSoft,
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  statusTextBlock: {
    flex: 1,
  },
  statusTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  statusDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  editSettingsLink: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  editSettingsLinkText: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: "700",
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  settingsCardPressed: {
    backgroundColor: COLORS.surfaceElevated,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  settingLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  settingValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
  },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    maxWidth: "48%",
  },
  playerChipName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  rulesCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
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
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  footerActions: {
    gap: SPACING.sm,
  },
});
