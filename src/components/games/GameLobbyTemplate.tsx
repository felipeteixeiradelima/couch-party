import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { GAMES_BY_ID, getGameVisuals } from "@/constants/games";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { usePlayers } from "@/hooks/usePlayers";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
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
  const theme = useTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const game = GAMES_BY_ID[gameId];
  const gameVisuals = getGameVisuals(gameId, theme);

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
            ...(gameId === "impostor"
              ? [
                  {
                    label: "Dica para o impostor",
                    value: lobbyConfig.settings.hintEnabled
                      ? "Ativada"
                      : "Desativada",
                  },
                ]
              : []),
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
                color={colors.textPrimary}
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
            color={isReady ? colors.success : colors.warning}
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
                <Text
                  style={[styles.ruleIndex, { color: gameVisuals.accentColor }]}
                >
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
              <Ionicons name="people-outline" size={20} color={colors.white} />
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
                icon={<Ionicons name="play" size={18} color={colors.white} />}
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

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerActionButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.successSoft,
      borderColor: colors.successBorder,
    },
    statusWarning: {
      backgroundColor: colors.warningSoft,
      borderColor: colors.warningBorder,
    },
    statusTextBlock: {
      flex: 1,
    },
    statusTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 2,
    },
    statusDescription: {
      color: colors.textSecondary,
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
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    sectionCount: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    editSettingsLink: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
    },
    editSettingsLinkText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    settingsCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    settingsCardPressed: {
      backgroundColor: colors.surfaceElevated,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.md,
      paddingVertical: SPACING.md,
    },
    settingLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    settingValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
      flexShrink: 1,
      textAlign: "right",
    },
    settingDivider: {
      height: 1,
      backgroundColor: colors.borderSubtle,
    },
    emptyBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      alignItems: "center",
    },
    emptyText: {
      color: colors.textSecondary,
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      maxWidth: "48%",
    },
    playerChipName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
      flexShrink: 1,
    },
    rulesCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    footerActions: {
      gap: SPACING.sm,
    },
  });
