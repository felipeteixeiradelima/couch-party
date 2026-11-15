import { Button } from "@/components/ui/Button";
import { CircularTimer, getTimerColor } from "@/components/ui/CircularTimer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { ActiveRoundState } from "@/types/game";
import { formatPlayerNames, formatTimer } from "@/utils/gameEngine";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface VotingPhaseProps {
  round: ActiveRoundState;
  onFinishVoting: (votedPlayerIds: readonly string[]) => void;
  onRequestExit: () => void;
}

export function VotingPhase({
  round,
  onFinishVoting,
  onRequestExit,
}: VotingPhaseProps) {
  const { votingTimerEnabled, votingDurationSeconds, impostorCount } =
    round.settingsSnapshot;
  const requiredVotes = Math.max(1, impostorCount);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(
    votingDurationSeconds,
  );
  const [endConfirmVisible, setEndConfirmVisible] = useState(false);
  const [voteConfirmVisible, setVoteConfirmVisible] = useState(false);
  const [timerBottomY, setTimerBottomY] = useState(190);
  const [showStickyTimer, setShowStickyTimer] = useState(false);

  const selectedPlayerIdsRef = useRef<string[]>([]);
  const hasFinishedRef = useRef(false);
  const stickyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    selectedPlayerIdsRef.current = selectedPlayerIds;
  }, [selectedPlayerIds]);

  const finishOnce = useCallback(
    (playerIds: readonly string[]) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      setEndConfirmVisible(false);
      setVoteConfirmVisible(false);
      onFinishVoting(playerIds);
    },
    [onFinishVoting],
  );

  useEffect(() => {
    hasFinishedRef.current = false;
    setSelectedPlayerIds([]);
    selectedPlayerIdsRef.current = [];
    setRemainingSeconds(votingDurationSeconds);
    setEndConfirmVisible(false);
    setVoteConfirmVisible(false);
    setShowStickyTimer(false);
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
      finishOnce(selectedPlayerIdsRef.current);
    }
  }, [votingTimerEnabled, remainingSeconds, finishOnce]);

  useEffect(() => {
    Animated.timing(stickyAnim, {
      toValue: showStickyTimer ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showStickyTimer, stickyAnim]);

  const selectedPlayers = useMemo(
    () =>
      round.assignments
        .filter((assignment) =>
          selectedPlayerIds.includes(assignment.player.id),
        )
        .map((assignment) => assignment.player),
    [round.assignments, selectedPlayerIds],
  );

  const isSelectionComplete = selectedPlayerIds.length === requiredVotes;
  const isAtSelectionLimit = selectedPlayerIds.length >= requiredVotes;

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }

      if (requiredVotes === 1) {
        return [playerId];
      }

      if (prev.length >= requiredVotes) {
        return prev;
      }

      return [...prev, playerId];
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!votingTimerEnabled) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const threshold = Math.max(80, timerBottomY - 24);
    const shouldShow = offsetY > threshold;
    if (shouldShow !== showStickyTimer) {
      setShowStickyTimer(shouldShow);
    }
  };

  const timerColor = getTimerColor(remainingSeconds, votingDurationSeconds);
  const progressRatio =
    votingDurationSeconds > 0
      ? Math.min(1, Math.max(0, remainingSeconds / votingDurationSeconds))
      : 0;

  const selectedNamesText = formatPlayerNames(selectedPlayers);

  const endModalMessage =
    selectedPlayers.length === 0
      ? "Nenhum jogador foi selecionado. Se encerrar agora, os impostores vencerão por W.O. Deseja continuar?"
      : selectedPlayers.length < requiredVotes
        ? `Apenas ${selectedPlayers.length} de ${requiredVotes} votos foram selecionados (${selectedNamesText}). Se encerrar agora sem completar os votos, os impostores vencerão. Deseja encerrar mesmo assim?`
        : requiredVotes === 1
          ? `Deseja encerrar a votação agora e confirmar o voto em ${selectedNamesText}?`
          : `Deseja encerrar a votação agora e confirmar os votos em ${selectedNamesText}?`;

  const stickyTranslateY = stickyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

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

      <View style={styles.scrollWrapper}>
        {/* Compact sticky timer bar when scrolled past the main circular timer */}
        {votingTimerEnabled ? (
          <Animated.View
            pointerEvents={showStickyTimer ? "auto" : "none"}
            accessibilityElementsHidden={!showStickyTimer}
            importantForAccessibility={
              showStickyTimer ? "yes" : "no-hide-descendants"
            }
            style={[
              styles.stickyTimerBar,
              {
                opacity: stickyAnim,
                transform: [{ translateY: stickyTranslateY }],
              },
            ]}
          >
            <View style={styles.stickyTimerMain}>
              <View style={styles.stickyTimerLeft}>
                <View
                  style={[styles.stickyDot, { backgroundColor: timerColor }]}
                />
                <View>
                  <Text style={styles.stickyTimeText}>
                    {formatTimer(remainingSeconds)}
                  </Text>
                  <Text style={styles.stickySubText}>Tempo de discussão</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setEndConfirmVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Encerrar votação"
                style={({ pressed }) => [
                  styles.stickyEndButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.stickyEndButtonText}>Encerrar</Text>
              </Pressable>
            </View>

            <View style={styles.stickyProgressTrack}>
              <View
                style={[
                  styles.stickyProgressFill,
                  {
                    width: `${progressRatio * 100}%`,
                    backgroundColor: timerColor,
                  },
                ]}
              />
            </View>
          </Animated.View>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Timer / End voting section */}
          <View style={styles.timerSection}>
            {votingTimerEnabled ? (
              <View
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                  setTimerBottomY(y + height);
                }}
              >
                <CircularTimer
                  remainingSeconds={remainingSeconds}
                  totalSeconds={votingDurationSeconds}
                  label="Tempo de discussão"
                />
              </View>
            ) : (
              <View style={styles.noTimerBanner}>
                <Ionicons
                  name="infinite-outline"
                  size={20}
                  color={COLORS.primaryText}
                />
                <Text style={styles.noTimerText}>
                  Votação sem limite de tempo
                </Text>
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
            <View style={styles.questionHeaderRow}>
              <Text style={styles.questionHeading}>
                {requiredVotes > 1
                  ? "Quem são os impostores?"
                  : "Quem é o impostor?"}
              </Text>
              {requiredVotes > 1 ? (
                <View
                  style={[
                    styles.selectionBadge,
                    isSelectionComplete && styles.selectionBadgeComplete,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectionBadgeText,
                      isSelectionComplete && styles.selectionBadgeTextComplete,
                    ]}
                  >
                    {selectedPlayerIds.length}/{requiredVotes}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.questionSubtitle}>
              {requiredVotes > 1
                ? isAtSelectionLimit
                  ? `${requiredVotes} jogadores selecionados. Toque em um selecionado para trocar.`
                  : `Escolha ${requiredVotes} pessoas para votar.`
                : "Escolha uma pessoa para votar."}
            </Text>

            <View style={styles.playersGrid}>
              {round.assignments.map(({ player }) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                const isLockedOut =
                  requiredVotes > 1 && isAtSelectionLimit && !isSelected;

                return (
                  <Pressable
                    key={player.id}
                    onPress={() => handleTogglePlayer(player.id)}
                    accessibilityRole={requiredVotes > 1 ? "checkbox" : "radio"}
                    accessibilityState={{
                      selected: isSelected,
                      checked: isSelected,
                      disabled: isLockedOut,
                    }}
                    accessibilityLabel={`Votar em ${player.name}`}
                    style={({ pressed }) => [
                      styles.playerCard,
                      isSelected && styles.playerCardSelected,
                      isLockedOut && styles.playerCardMuted,
                      pressed && !isLockedOut && styles.pressed,
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
                          requiredVotes > 1 && styles.checkboxShape,
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
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.voteStatusText,
            isSelectionComplete && styles.voteStatusSelected,
          ]}
          numberOfLines={2}
        >
          {selectedPlayers.length === 0
            ? requiredVotes > 1
              ? `Nenhum jogador selecionado (escolha ${requiredVotes})`
              : "Nenhum jogador selecionado"
            : requiredVotes === 1
              ? `Seu voto: ${selectedNamesText}`
              : isSelectionComplete
                ? `Seus votos (${requiredVotes}/${requiredVotes}): ${selectedNamesText}`
                : `Selecionados (${selectedPlayers.length}/${requiredVotes}): ${selectedNamesText}`}
        </Text>

        <Button
          label={requiredVotes > 1 ? "Confirmar Votos" : "Confirmar Voto"}
          onPress={() => setVoteConfirmVisible(true)}
          disabled={!isSelectionComplete}
          icon={<Ionicons name="checkmark" size={20} color={COLORS.white} />}
        />
      </View>

      <ConfirmModal
        visible={voteConfirmVisible}
        title={requiredVotes > 1 ? "Confirmar votos?" : "Confirmar voto?"}
        message={
          requiredVotes > 1
            ? `Deseja confirmar os votos do grupo em ${selectedNamesText}?`
            : `Deseja confirmar o voto do grupo em ${selectedNamesText}?`
        }
        confirmLabel={requiredVotes > 1 ? "Confirmar votos" : "Confirmar voto"}
        cancelLabel="Voltar"
        iconName="checkmark-circle-outline"
        onConfirm={() => finishOnce(selectedPlayerIds)}
        onCancel={() => setVoteConfirmVisible(false)}
      />

      <ConfirmModal
        visible={endConfirmVisible}
        title="Encerrar votação?"
        message={endModalMessage}
        confirmLabel="Encerrar votação"
        cancelLabel="Voltar à votação"
        confirmVariant={isSelectionComplete ? "primary" : "danger"}
        iconName={
          isSelectionComplete ? "checkmark-circle-outline" : "warning-outline"
        }
        onConfirm={() => finishOnce(selectedPlayerIds)}
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
  scrollWrapper: {
    flex: 1,
    position: "relative",
  },
  stickyTimerBar: {
    position: "absolute",
    top: 0,
    left: SPACING.xl,
    right: SPACING.xl,
    zIndex: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  stickyTimerMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  stickyTimerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  stickyDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
  },
  stickyTimeText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  stickySubText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  stickyEndButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  stickyEndButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  stickyProgressTrack: {
    height: 3,
    backgroundColor: COLORS.border,
  },
  stickyProgressFill: {
    height: "100%",
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
  questionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  questionHeading: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  selectionBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  selectionBadgeComplete: {
    backgroundColor: COLORS.successSoft,
    borderColor: "rgba(16, 185, 129, 0.45)",
  },
  selectionBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  selectionBadgeTextComplete: {
    color: COLORS.success,
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
  playerCardMuted: {
    opacity: 0.55,
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
  checkboxShape: {
    borderRadius: RADIUS.sm,
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
