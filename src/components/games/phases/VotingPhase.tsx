import { Button } from "@/components/ui/Button";
import { CircularTimer } from "@/components/ui/CircularTimer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { ActiveRoundState } from "@/types/game";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface VotingPhaseProps {
  round: ActiveRoundState;
  onFinishVoting: (votedPlayerId: string | null) => void;
  onRequestExit: () => void;
}

export function VotingPhase({
  round,
  onFinishVoting,
  onRequestExit,
}: VotingPhaseProps) {
  const { votingTimerEnabled, votingDurationSeconds } = round.settingsSnapshot;

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    votingDurationSeconds,
  );
  const [endConfirmVisible, setEndConfirmVisible] = useState(false);

  const selectedPlayerIdRef = useRef<string | null>(null);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    selectedPlayerIdRef.current = selectedPlayerId;
  }, [selectedPlayerId]);

  const finishOnce = useCallback(
    (playerId: string | null) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      setEndConfirmVisible(false);
      onFinishVoting(playerId);
    },
    [onFinishVoting],
  );

  useEffect(() => {
    hasFinishedRef.current = false;
    setSelectedPlayerId(null);
    selectedPlayerIdRef.current = null;
    setRemainingSeconds(votingDurationSeconds);
  }, [round.roundNumber, votingDurationSeconds]);

  useEffect(() => {
    if (!votingTimerEnabled) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [votingTimerEnabled, round.roundNumber]);

  useEffect(() => {
    if (votingTimerEnabled && remainingSeconds === 0) {
      finishOnce(selectedPlayerIdRef.current);
    }
  }, [votingTimerEnabled, remainingSeconds, finishOnce]);

  const selectedPlayer =
    round.assignments.find(
      (assignment) => assignment.player.id === selectedPlayerId,
    )?.player ?? null;

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerId((prev) => (prev === playerId ? null : playerId));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Discussão e votação</Text>
        <Pressable
          onPress={onRequestExit}
          accessibilityRole="button"
          accessibilityLabel="Sair da partida"
          style={({ pressed }) => [
            styles.exitButton,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer / End voting section */}
        <View style={styles.timerSection}>
          {votingTimerEnabled ? (
            <CircularTimer
              remainingSeconds={remainingSeconds}
              totalSeconds={votingDurationSeconds}
              label="Tempo de discussão"
            />
          ) : (
            <View style={styles.noTimerBanner}>
              <Ionicons
                name="infinite-outline"
                size={20}
                color={COLORS.primaryText}
              />
              <Text style={styles.noTimerText}>Votação sem limite de tempo</Text>
            </View>
          )}

          <Pressable
            onPress={() => setEndConfirmVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Encerrar votação"
            style={({ pressed }) => [
              styles.endVotingPill,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.endVotingPillText}>Encerrar votação</Text>
          </Pressable>
        </View>

        {/* Voting question & grid */}
        <View style={styles.votingSection}>
          <Text style={styles.questionHeading}>Quem é o impostor?</Text>
          <Text style={styles.questionSubtitle}>
            Escolha uma pessoa para votar.
          </Text>

          <View style={styles.playersGrid}>
            {round.assignments.map(({ player }) => {
              const isSelected = selectedPlayerId === player.id;

              return (
                <Pressable
                  key={player.id}
                  onPress={() => handleTogglePlayer(player.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, checked: isSelected }}
                  accessibilityLabel={`Votar em ${player.name}`}
                  style={({ pressed }) => [
                    styles.playerCard,
                    isSelected && styles.playerCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.playerCardTop}>
                    <PlayerAvatar
                      name={player.name}
                      color={player.color}
                      size={36}
                    />

                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={COLORS.background}
                        />
                      ) : null}
                    </View>
                  </View>

                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.voteStatusText,
            selectedPlayer && styles.voteStatusSelected,
          ]}
        >
          {selectedPlayer
            ? `Seu voto: ${selectedPlayer.name}`
            : "Nenhum jogador selecionado"}
        </Text>

        <Button
          label="Confirmar Voto"
          onPress={() => finishOnce(selectedPlayerId)}
          disabled={!selectedPlayerId}
          icon={
            <Ionicons name="checkmark" size={20} color={COLORS.white} />
          }
        />
      </View>

      <ConfirmModal
        visible={endConfirmVisible}
        title="Encerrar votação?"
        message={
          selectedPlayer
            ? `Deseja encerrar a votação agora e confirmar o voto em ${selectedPlayer.name}?`
            : "Nenhum jogador foi selecionado. Se encerrar agora, o impostor vencerá por W.O. Deseja continuar?"
        }
        confirmLabel="Encerrar votação"
        cancelLabel="Voltar à votação"
        confirmVariant={selectedPlayer ? "primary" : "danger"}
        iconName={selectedPlayer ? "checkmark-circle-outline" : "warning-outline"}
        onConfirm={() => finishOnce(selectedPlayerId)}
        onCancel={() => setEndConfirmVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerSpacer: {
    width: 38,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  exitButton: {
    width: 38,
    height: 38,
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
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xxl,
  },
  timerSection: {
    alignItems: "center",
    gap: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  noTimerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  noTimerText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  endVotingPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  endVotingPillText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  votingSection: {
    gap: SPACING.sm,
  },
  questionHeading: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  questionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  playerCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  playerCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  playerCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    gap: SPACING.md,
  },
  voteStatusText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  voteStatusSelected: {
    color: COLORS.success,
  },
});
