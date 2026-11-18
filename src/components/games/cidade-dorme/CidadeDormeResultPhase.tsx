import { RoleBadgeIcon } from "@/components/games/cidade-dorme/RoleBadgeIcon";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { CidadeDormeMatchState } from "@/types/cidadeDorme";
import {
  CIDADE_DORME_ROLE_META,
  getCidadeDormeRoleVisuals,
} from "@/utils/cidadeDormeEngine";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface CidadeDormeResultPhaseProps {
  match: CidadeDormeMatchState;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export function CidadeDormeResultPhase({
  match,
  onPlayAgain,
  onBackToLobby,
}: CidadeDormeResultPhaseProps) {
  const theme = useTheme();
  const { colors, cidadeDorme } = theme;
  const styles = useThemedStyles(createStyles);

  const citizensWon = match.winner === "citizens";
  const accentColor = citizensWon ? colors.success : colors.danger;
  const softBgColor = citizensWon ? colors.successSoft : colors.dangerSoft;
  const borderColor = citizensWon ? colors.successBorder : colors.dangerBorder;

  const assassins = match.players.filter((entry) => entry.role === "assassin");
  const hasMultipleAssassins = assassins.length > 1;

  const outcomeTitle = citizensWon
    ? "A Cidade Venceu!"
    : hasMultipleAssassins
      ? "Os Assassinos Venceram!"
      : "O Assassino Venceu!";

  const outcomeDescription = citizensWon
    ? hasMultipleAssassins
      ? "Todos os assassinos foram eliminados antes de dominar a cidade."
      : "O assassino foi descoberto e eliminado pela cidade."
    : "Os assassinos igualaram o número de inocentes e tomaram conta da cidade.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          FIM DE JOGO • {match.roundNumber} CICLO
          {match.roundNumber > 1 ? "S" : ""}
        </Text>
        <Text style={styles.headerTitle}>Resultado da Partida</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner banner */}
        <View
          style={[
            styles.winnerCard,
            { backgroundColor: softBgColor, borderColor },
          ]}
        >
          <View
            style={[styles.winnerIconCircle, { backgroundColor: softBgColor }]}
            accessible={false}
          >
            {citizensWon ? (
              <Ionicons name="trophy-outline" size={38} color={accentColor} />
            ) : (
              <MaterialCommunityIcons
                name="knife"
                size={38}
                color={accentColor}
              />
            )}
          </View>

          <Text style={[styles.winnerTitle, { color: accentColor }]}>
            {outcomeTitle}
          </Text>
          <Text style={styles.winnerDescription}>{outcomeDescription}</Text>
        </View>

        {/* All players & roles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Papéis da partida</Text>
          <View style={styles.rosterList}>
            {match.players.map((entry) => {
              const roleMeta = CIDADE_DORME_ROLE_META[entry.role];
              const roleVisuals = getCidadeDormeRoleVisuals(entry.role, theme);
              const statusLabel = entry.alive
                ? "Sobreviveu"
                : entry.eliminatedPhase?.kind === "night"
                  ? `Eliminado na Noite ${entry.eliminatedPhase.round}`
                  : `Eliminado no Dia ${entry.eliminatedPhase?.round ?? 1}`;

              return (
                <View key={entry.player.id} style={styles.rosterRow}>
                  <PlayerAvatar
                    name={entry.player.name}
                    color={entry.player.color}
                    size={36}
                  />

                  <View style={styles.rosterInfo}>
                    <Text style={styles.rosterName} numberOfLines={1}>
                      {entry.player.name}
                    </Text>
                    <Text
                      style={[
                        styles.rosterStatus,
                        entry.alive && styles.rosterStatusAlive,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: roleVisuals.softBgColor,
                        borderColor: roleVisuals.borderColor,
                      },
                    ]}
                  >
                    <RoleBadgeIcon
                      role={entry.role}
                      size={14}
                      color={roleVisuals.accentColor}
                    />
                    <Text
                      style={[
                        styles.roleChipText,
                        { color: roleVisuals.accentColor },
                      ]}
                    >
                      {roleMeta.title}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Match timeline */}
        {match.history.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumo dos acontecimentos</Text>
            <View style={styles.historyList}>
              {match.history.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyIconBox,
                      {
                        backgroundColor:
                          item.phase === "night"
                            ? cidadeDorme.night.accentSoft
                            : cidadeDorme.day.accentSoft,
                      },
                    ]}
                    accessible={false}
                  >
                    <Ionicons
                      name={
                        item.phase === "night"
                          ? "moon-outline"
                          : "sunny-outline"
                      }
                      size={15}
                      color={
                        item.phase === "night"
                          ? cidadeDorme.night.accent
                          : cidadeDorme.day.accent
                      }
                    />
                  </View>
                  <Text style={styles.historyText}>{item.message}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Jogar novamente"
          onPress={onPlayAgain}
          icon={<Ionicons name="refresh" size={20} color={colors.white} />}
        />
        <Button
          label="Configurações da partida"
          variant="secondary"
          onPress={onBackToLobby}
        />
      </View>
    </View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.md,
      alignItems: "center",
    },
    eyebrow: {
      color: colors.primaryText,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.4,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginTop: 2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxl,
      gap: SPACING.lg,
    },
    winnerCard: {
      borderWidth: 1.5,
      borderRadius: RADIUS.xl,
      padding: SPACING.xxl,
      alignItems: "center",
    },
    winnerIconCircle: {
      width: 76,
      height: 76,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.md,
    },
    winnerTitle: {
      fontSize: 26,
      fontWeight: "900",
      textAlign: "center",
      marginBottom: SPACING.xs,
    },
    winnerDescription: {
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    rosterList: {
      gap: SPACING.md,
    },
    rosterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
    },
    rosterInfo: {
      flex: 1,
      minWidth: 0,
    },
    rosterName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    rosterStatus: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    rosterStatusAlive: {
      color: colors.success,
      fontWeight: "600",
    },
    roleChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
    },
    roleChipText: {
      fontSize: 12,
      fontWeight: "700",
    },
    historyList: {
      gap: SPACING.md,
    },
    historyRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.md,
    },
    historyIconBox: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    historyText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      gap: SPACING.sm,
    },
  });
