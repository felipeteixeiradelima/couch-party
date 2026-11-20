import { Button } from "@/components/ui/Button";
import { CircularTimer, getTimerColor } from "@/components/ui/CircularTimer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { ActiveRoundState } from "@/types/game";
import { formatPlayerNames, formatTimer } from "@/utils/gameEngine";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const { animationsEnabled } = useAppSettings();
  const { triggerSelection, triggerWarning } = useHaptics();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);

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
  const warnedAtTenRef = useRef(false);
  const [stickyAnim] = useState(() => new Animated.Value(0));

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
    if (!votingTimerEnabled) {
      return;
    }

    warnedAtTenRef.current = false;
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
    if (!votingTimerEnabled) return;
    if (remainingSeconds === 10 && !warnedAtTenRef.current) {
      warnedAtTenRef.current = true;
      triggerWarning();
    }
    if (remainingSeconds === 0) {
      triggerWarning();
      finishOnce(selectedPlayerIdsRef.current);
    }
  }, [votingTimerEnabled, remainingSeconds, finishOnce, triggerWarning]);

  useEffect(() => {
    if (!animationsEnabled) {
      stickyAnim.setValue(showStickyTimer ? 1 : 0);
      return;
    }

    Animated.timing(stickyAnim, {
      toValue: showStickyTimer ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [animationsEnabled, showStickyTimer, stickyAnim]);

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
    triggerSelection();
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

  const timerColor = getTimerColor(
    remainingSeconds,
    votingDurationSeconds,
    colors,
  );
  const progressRatio =
    votingDurationSeconds > 0
      ? Math.min(1, Math.max(0, remainingSeconds / votingDurationSeconds))
      : 0;

  const selectedNamesText = formatPlayerNames(selectedPlayers);

  const endModalMessage =
    selectedPlayers.length === 0
      ? "Nenhum jogador foi escolhido pelo grupo. Se encerrar agora, os impostores vencerão por W.O. Deseja continuar?"
      : selectedPlayers.length < requiredVotes
        ? `Apenas ${selectedPlayers.length} de ${requiredVotes} escolhas do grupo foram marcadas (${selectedNamesText}). Se encerrar agora sem completar os votos, os impostores vencerão. Deseja encerrar mesmo assim?`
        : requiredVotes === 1
          ? `Deseja encerrar a votação e confirmar a escolha do grupo em ${selectedNamesText}?`
          : `Deseja encerrar a votação e confirmar as escolhas do grupo em ${selectedNamesText}?`;

  const stickyTranslateY = stickyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Votação do grupo</Text>
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
          <Ionicons name="close" size={20} color={colors.textSecondary} />
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
                  <Text style={styles.stickySubText}>Tempo de votação</Text>
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
                  label="Tempo de votação"
                />
              </View>
            ) : (
              <View style={styles.noTimerBanner}>
                <Ionicons
                  name="infinite-outline"
                  size={20}
                  color={colors.primaryText}
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
            {round.prompt.gameId === "perguntas" ? (
              <View style={styles.questionRecapBox}>
                <Text style={styles.questionRecapLabel}>
                  PERGUNTA DA MAIORIA
                </Text>
                <Text style={styles.questionRecapText}>
                  {round.prompt.innocentQuestion}
                </Text>
              </View>
            ) : null}

            <View style={styles.groupChoicePill}>
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.primaryText}
              />
              <Text style={styles.groupChoicePillText}>
                Decisão coletiva do grupo
              </Text>
            </View>

            <View style={styles.questionHeaderRow}>
              <Text style={styles.questionHeading}>
                {requiredVotes > 1
                  ? "Quem o grupo vai votar?"
                  : "Quem o grupo escolheu?"}
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
              {round.prompt.gameId === "perguntas"
                ? requiredVotes > 1
                  ? `Registre aqui os ${requiredVotes} jogadores que o grupo decidiu que receberam a pergunta diferente.`
                  : "Registre aqui quem o grupo decidiu que recebeu a pergunta diferente."
                : requiredVotes > 1
                  ? isAtSelectionLimit
                    ? `${requiredVotes} jogadores escolhidos pelo grupo. Toque em um selecionado para trocar.`
                    : `Registre aqui os ${requiredVotes} jogadores escolhidos pelo grupo.`
                  : "Registre aqui o jogador escolhido pelo grupo para eliminar."}
            </Text>

            <View style={styles.playersGrid}>
              {round.assignments.map(({ player }) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                const isLockedOut =
                  requiredVotes > 1 && isAtSelectionLimit && !isSelected;
                const playerAnswer =
                  round.prompt.gameId === "perguntas"
                    ? round.answers[player.id]
                    : undefined;

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
                    accessibilityLabel={`Selecionar ${player.name} na escolha do grupo`}
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
                            color={
                              theme.isDark ? colors.background : colors.white
                            }
                          />
                        ) : null}
                      </View>
                    </View>

                    <Text style={styles.playerName} numberOfLines={1}>
                      {player.name}
                    </Text>

                    {playerAnswer ? (
                      <Text
                        style={styles.playerAnswerPreview}
                        numberOfLines={3}
                      >
                        “{playerAnswer}”
                      </Text>
                    ) : null}
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
              ? `Nenhum jogador escolhido pelo grupo (escolha ${requiredVotes})`
              : "Nenhum jogador escolhido pelo grupo"
            : requiredVotes === 1
              ? `Escolha do grupo: ${selectedNamesText}`
              : isSelectionComplete
                ? `Escolhas do grupo (${requiredVotes}/${requiredVotes}): ${selectedNamesText}`
                : `Escolhidos pelo grupo (${selectedPlayers.length}/${requiredVotes}): ${selectedNamesText}`}
        </Text>

        <Button
          label={
            requiredVotes > 1
              ? "Confirmar Escolhas do Grupo"
              : "Confirmar Escolha do Grupo"
          }
          onPress={() => setVoteConfirmVisible(true)}
          disabled={!isSelectionComplete}
          icon={<Ionicons name="checkmark" size={20} color={colors.white} />}
        />
      </View>

      <ConfirmModal
        visible={voteConfirmVisible}
        title={
          requiredVotes > 1
            ? "Confirmar escolhas do grupo?"
            : "Confirmar escolha do grupo?"
        }
        message={
          requiredVotes > 1
            ? `Deseja confirmar as escolhas do grupo em ${selectedNamesText}?`
            : `Deseja confirmar a escolha do grupo em ${selectedNamesText}?`
        }
        confirmLabel={
          requiredVotes > 1 ? "Confirmar escolhas" : "Confirmar escolha"
        }
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

const createStyles = ({ colors, shadowOpacity }: AppTheme) =>
  StyleSheet.create({
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
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
    },
    exitButton: {
      width: 38,
      height: 38,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      overflow: "hidden",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity,
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
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    stickySubText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
    },
    stickyEndButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 8,
      minHeight: 36,
      justifyContent: "center",
    },
    stickyEndButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    stickyProgressTrack: {
      height: 3,
      backgroundColor: colors.border,
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    noTimerText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    endVotingPill: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
    },
    endVotingPillText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    votingSection: {
      gap: SPACING.sm,
    },
    groupChoicePill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
      marginBottom: 2,
    },
    groupChoicePillText: {
      color: colors.primaryText,
      fontSize: 12,
      fontWeight: "700",
    },
    questionRecapBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.warningBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      gap: 4,
      marginBottom: SPACING.xs,
    },
    questionRecapLabel: {
      color: colors.warning,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
    },
    questionRecapText: {
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700",
    },
    questionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
    },
    questionHeading: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    selectionBadge: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 4,
    },
    selectionBadgeComplete: {
      backgroundColor: colors.successSoft,
      borderColor: colors.successBorder,
    },
    selectionBadgeText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    selectionBadgeTextComplete: {
      color: colors.success,
    },
    questionSubtitle: {
      color: colors.textSecondary,
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
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      gap: SPACING.md,
    },
    playerCardSelected: {
      borderColor: colors.success,
      backgroundColor: colors.successTint,
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
      borderColor: colors.textMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxShape: {
      borderRadius: RADIUS.sm,
    },
    radioCircleSelected: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    playerName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    playerAnswerPreview: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      gap: SPACING.md,
    },
    voteStatusText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    voteStatusSelected: {
      color: colors.success,
    },
  });
