import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { ActiveRoundState, RoundResult } from "@/types/game";
import { formatPlayerNames } from "@/utils/gameEngine";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface ResultPhaseProps {
  round: ActiveRoundState;
  result: RoundResult;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export function ResultPhase({
  round,
  result,
  onPlayAgain,
  onBackToLobby,
}: ResultPhaseProps) {
  const innocentsWon = result.winningRole === "innocent";
  const accentColor = innocentsWon ? COLORS.success : COLORS.danger;
  const softBgColor = innocentsWon ? COLORS.successSoft : COLORS.dangerSoft;
  const borderColor = innocentsWon
    ? "rgba(16, 185, 129, 0.4)"
    : "rgba(244, 63, 94, 0.4)";

  const { prompt } = round;
  const hasMultipleImpostors = result.impostors.length > 1;
  const votedNames = formatPlayerNames(
    result.votedPlayers.map((assignment) => assignment.player),
  );
  const innocentVotes = result.votedPlayers.filter(
    (assignment) => assignment.role === "innocent",
  );

  const outcomeTitle = innocentsWon
    ? "Inocentes venceram!"
    : hasMultipleImpostors
      ? "Impostores venceram!"
      : "Impostor venceu!";

  const outcomeDescription = innocentsWon
    ? hasMultipleImpostors
      ? `Todos os impostores (${votedNames}) foram descobertos!`
      : `${votedNames} era o impostor!`
    : result.isWalkover
      ? "Nenhum jogador foi votado antes do encerramento (vitória por W.O.)."
      : innocentVotes.length > 0
        ? hasMultipleImpostors
          ? `${formatPlayerNames(innocentVotes.map((a) => a.player))} ${innocentVotes.length > 1 ? "eram inocentes" : "era inocente"} e os impostores venceram.`
          : `${votedNames} era inocente e o verdadeiro impostor escapou.`
        : `A votação encerrou antes de selecionar todos os ${result.impostors.length} impostores.`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>RESULTADO DA RODADA {round.roundNumber}</Text>
        <Text style={styles.headerTitle}>Fim de jogo</Text>
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
            {innocentsWon ? (
              <Ionicons name="trophy-outline" size={38} color={accentColor} />
            ) : (
              <MaterialCommunityIcons
                name="drama-masks"
                size={38}
                color={accentColor}
              />
            )}
          </View>

          {result.isWalkover ? (
            <View style={styles.woBadge}>
              <Text style={styles.woBadgeText}>VITÓRIA POR W.O.</Text>
            </View>
          ) : null}

          <Text style={[styles.winnerTitle, { color: accentColor }]}>
            {outcomeTitle}
          </Text>
          <Text style={styles.winnerDescription}>{outcomeDescription}</Text>
        </View>

        {/* Secret word / questions reveal */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>
              {prompt.gameId === "impostor"
                ? "Palavra da rodada"
                : "Perguntas da rodada"}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{prompt.categoryName}</Text>
            </View>
          </View>

          {prompt.gameId === "impostor" ? (
            <View style={styles.revealList}>
              <View style={styles.revealItem}>
                <Text style={styles.revealLabel}>PALAVRA SECRETA</Text>
                <Text style={styles.revealSecretWord}>{prompt.secretWord}</Text>
              </View>

              {prompt.impostorHint ? (
                <View style={styles.revealSubItem}>
                  <Text style={styles.revealLabel}>DICA DO IMPOSTOR</Text>
                  <Text style={styles.revealValue}>{prompt.impostorHint}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.revealList}>
              <View style={styles.revealItem}>
                <Text style={styles.revealLabel}>PERGUNTA DOS INOCENTES</Text>
                <Text style={styles.revealQuestion}>
                  {prompt.innocentQuestion}
                </Text>
              </View>

              <View style={styles.revealSubItem}>
                <Text style={[styles.revealLabel, { color: COLORS.danger }]}>
                  PERGUNTA DO IMPOSTOR
                </Text>
                <Text style={styles.revealQuestion}>
                  {prompt.impostorQuestion}
                </Text>
              </View>

              {prompt.impostorHint ? (
                <View style={styles.revealSubItem}>
                  <Text style={styles.revealLabel}>DICA DO IMPOSTOR</Text>
                  <Text style={styles.revealValue}>{prompt.impostorHint}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Impostors reveal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {hasMultipleImpostors ? "Impostores da rodada" : "Impostor da rodada"}
          </Text>
          <View style={styles.playersList}>
            {result.impostors.map((impostor) => (
              <View key={impostor.id} style={styles.impostorChip}>
                <PlayerAvatar
                  name={impostor.name}
                  color={impostor.color}
                  size={30}
                />
                <Text style={styles.impostorName}>{impostor.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vote summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resultado da votação</Text>
          {result.votedPlayers.length > 0 ? (
            <View style={styles.voteList}>
              {result.votedPlayers.map(({ player, role }) => (
                <View key={player.id} style={styles.voteRow}>
                  <PlayerAvatar
                    name={player.name}
                    color={player.color}
                    size={34}
                  />
                  <View style={styles.voteInfo}>
                    <Text style={styles.votePlayerName}>{player.name}</Text>
                    <Text
                      style={[
                        styles.votePlayerRole,
                        role === "impostor"
                          ? styles.voteRoleImpostor
                          : styles.voteRoleInnocent,
                      ]}
                    >
                      {role === "impostor" ? "Era impostor" : "Era inocente"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noVoteText}>
              Nenhum jogador foi escolhido durante a votação (W.O.).
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Jogar novamente"
          onPress={onPlayAgain}
          icon={<Ionicons name="refresh" size={20} color={COLORS.white} />}
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

const styles = StyleSheet.create({
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
    color: COLORS.primaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: COLORS.textPrimary,
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
  woBadge: {
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.45)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  woBadgeText: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  winnerTitle: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  winnerDescription: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  revealList: {
    gap: SPACING.md,
  },
  revealItem: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 4,
  },
  revealSubItem: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 4,
  },
  revealLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  revealSecretWord: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  revealQuestion: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  revealValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  playersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  impostorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.35)",
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  impostorName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  voteList: {
    gap: SPACING.md,
  },
  voteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  voteInfo: {
    flex: 1,
  },
  votePlayerName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  votePlayerRole: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  voteRoleImpostor: {
    color: COLORS.success,
  },
  voteRoleInnocent: {
    color: COLORS.danger,
  },
  noVoteText: {
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
    gap: SPACING.sm,
  },
});
