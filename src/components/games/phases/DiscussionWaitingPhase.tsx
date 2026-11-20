import { Button } from "@/components/ui/Button";
import { CircularTimer, getTimerColor } from "@/components/ui/CircularTimer";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GAMES_BY_ID } from "@/constants/games";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { ActiveRoundState } from "@/types/game";
import { formatTimer, getQuestionReadingSeconds } from "@/utils/gameEngine";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

interface DiscussionWaitingPhaseProps {
  round: ActiveRoundState;
  onAdvanceToVoting: () => void;
  onRequestExit: () => void;
}

export function DiscussionWaitingPhase({
  round,
  onAdvanceToVoting,
  onRequestExit,
}: DiscussionWaitingPhaseProps) {
  const { animationsEnabled } = useAppSettings();
  const { triggerLightImpact, triggerWarning } = useHaptics();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const game = GAMES_BY_ID[round.prompt.gameId];
  const { impostorCount, discussionTimerEnabled, discussionDurationSeconds } =
    round.settingsSnapshot;
  const isImpostorGame = round.prompt.gameId === "impostor";

  const hasTimer = isImpostorGame ? discussionTimerEnabled : true;
  const totalTimerSeconds = isImpostorGame
    ? discussionDurationSeconds
    : getQuestionReadingSeconds(round.assignments.length);

  const [remainingSeconds, setRemainingSeconds] = useState(totalTimerSeconds);
  const [timerBottomY, setTimerBottomY] = useState(190);
  const [showStickyTimer, setShowStickyTimer] = useState(false);

  const hasAdvancedRef = useRef(false);
  const warnedAtTenRef = useRef(false);
  const [stickyAnim] = useState(() => new Animated.Value(0));

  const startingPlayer = isImpostorGame
    ? (round.assignments.find(
        (assignment) => assignment.player.id === round.startingPlayerId,
      )?.player ?? round.assignments[0]?.player)
    : undefined;

  const advanceOnce = useCallback(() => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    onAdvanceToVoting();
  }, [onAdvanceToVoting]);

  useEffect(() => {
    if (!hasTimer) {
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
  }, [hasTimer, round.roundNumber]);

  useEffect(() => {
    if (!hasTimer) return;

    if (isImpostorGame && remainingSeconds === 10 && !warnedAtTenRef.current) {
      warnedAtTenRef.current = true;
      triggerWarning();
    }

    if (remainingSeconds === 0) {
      if (isImpostorGame) {
        triggerWarning();
      } else {
        triggerLightImpact();
      }
      advanceOnce();
    }
  }, [
    hasTimer,
    isImpostorGame,
    remainingSeconds,
    advanceOnce,
    triggerWarning,
    triggerLightImpact,
  ]);

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isImpostorGame || !discussionTimerEnabled) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const threshold = Math.max(80, timerBottomY - 24);
    const shouldShow = offsetY > threshold;
    if (shouldShow !== showStickyTimer) {
      setShowStickyTimer(shouldShow);
    }
  };

  const timerColor = getTimerColor(remainingSeconds, totalTimerSeconds, colors);
  const progressRatio =
    totalTimerSeconds > 0
      ? Math.min(1, Math.max(0, remainingSeconds / totalTimerSeconds))
      : 0;
  const stickyTranslateY = stickyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>RODADA {round.roundNumber}</Text>
          <Text style={styles.title}>{game.title}</Text>
        </View>

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
        {isImpostorGame && discussionTimerEnabled ? (
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
                onPress={advanceOnce}
                accessibilityRole="button"
                accessibilityLabel="Ir para votação"
                style={({ pressed }) => [
                  styles.stickyActionButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.stickyActionButtonText}>Votar</Text>
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
          {isImpostorGame ? (
            <>
              {discussionTimerEnabled ? (
                <View
                  style={styles.timerSection}
                  onLayout={(event) => {
                    const { y, height } = event.nativeEvent.layout;
                    setTimerBottomY(y + height);
                  }}
                >
                  <CircularTimer
                    remainingSeconds={remainingSeconds}
                    totalSeconds={totalTimerSeconds}
                    label="Tempo de discussão"
                  />
                </View>
              ) : null}

              {startingPlayer ? (
                <View
                  style={styles.starterCard}
                  accessibilityLabel={`${startingPlayer.name} começa a discussão`}
                >
                  <PlayerAvatar
                    name={startingPlayer.name}
                    color={startingPlayer.color}
                    size={42}
                  />
                  <View style={styles.starterTextBlock}>
                    <Text style={styles.starterEyebrow}>QUEM COMEÇA</Text>
                    <Text style={styles.starterName}>
                      {startingPlayer.name} começa dando a primeira dica!
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.heroCard}>
                <View style={styles.heroIconCircle} accessible={false}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={34}
                    color={colors.primaryText}
                  />
                </View>

                <View style={styles.categoryPill}>
                  <Ionicons
                    name="pricetag-outline"
                    size={14}
                    color={colors.primaryText}
                  />
                  <Text style={styles.categoryPillText}>
                    Categoria: {round.prompt.categoryName}
                  </Text>
                </View>

                <Text style={styles.heroTitle}>
                  Hora de jogar presencialmente!
                </Text>
                <Text style={styles.heroDescription}>
                  Em roda, cada jogador deve falar uma palavra ou dica
                  relacionada à palavra secreta, sem entregá-la de bandeja. O
                  impostor precisa disfarçar!
                </Text>

                <View style={styles.infoBanner}>
                  <Ionicons
                    name="eye-off-outline"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.infoBannerText}>
                    {impostorCount === 1
                      ? "Há 1 impostor escondido no grupo."
                      : `Há ${impostorCount} impostores escondidos no grupo.`}
                  </Text>
                </View>
              </View>

              <View style={styles.playersSection}>
                <Text style={styles.sectionTitle}>
                  Jogadores na rodada ({round.assignments.length})
                </Text>
                <View style={styles.playersGrid}>
                  {round.assignments.map(({ player }) => {
                    const isStarter = startingPlayer?.id === player.id;
                    return (
                      <View
                        key={player.id}
                        style={[
                          styles.playerChip,
                          isStarter && styles.playerChipStarter,
                        ]}
                      >
                        <PlayerAvatar
                          name={player.name}
                          color={player.color}
                          size={28}
                        />
                        <Text style={styles.playerName} numberOfLines={1}>
                          {player.name}
                        </Text>
                        {isStarter ? (
                          <View style={styles.starterBadge}>
                            <Text style={styles.starterBadgeText}>Começa</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.questionRevealCard}>
                <View style={styles.categoryPill}>
                  <Ionicons
                    name="pricetag-outline"
                    size={14}
                    color={colors.primaryText}
                  />
                  <Text style={styles.categoryPillText}>
                    Categoria: {round.prompt.categoryName}
                  </Text>
                </View>

                <Text style={styles.questionRevealEyebrow}>
                  PERGUNTA DA MAIORIA
                </Text>
                <Text style={styles.questionRevealText}>
                  {round.prompt.gameId === "perguntas"
                    ? round.prompt.innocentQuestion
                    : ""}
                </Text>

                <View style={styles.infoBanner}>
                  <Ionicons
                    name="eye-off-outline"
                    size={16}
                    color={colors.warning}
                  />
                  <Text style={styles.infoBannerText}>
                    {impostorCount === 1
                      ? "1 jogador recebeu uma pergunta diferente!"
                      : `${impostorCount} jogadores receberam uma pergunta diferente!`}
                  </Text>
                </View>
              </View>

              <View style={styles.playersSection}>
                <View style={styles.answersHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    Respostas reveladas ({round.assignments.length})
                  </Text>
                  <Text style={styles.answersSubtitle}>
                    Comparem as respostas e debatam!
                  </Text>
                </View>

                <View style={styles.answersList}>
                  {round.assignments.map(({ player }) => {
                    const answer = round.answers[player.id] ?? "";
                    return (
                      <View key={player.id} style={styles.answerCard}>
                        <View style={styles.answerPlayerRow}>
                          <PlayerAvatar
                            name={player.name}
                            color={player.color}
                            size={32}
                          />
                          <Text
                            style={styles.answerPlayerName}
                            numberOfLines={1}
                          >
                            {player.name}
                          </Text>
                        </View>
                        <Text style={styles.answerValue}>
                          {answer.length > 0 ? answer : "Sem resposta"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {!isImpostorGame ? (
          <View
            style={styles.readingTimerContainer}
            accessibilityRole="timer"
            accessibilityLabel={`Tempo de leitura das respostas: ${formatTimer(remainingSeconds)}`}
          >
            <View style={styles.readingTimerTrack}>
              <View
                style={[
                  styles.readingTimerFill,
                  {
                    width: `${progressRatio * 100}%`,
                    backgroundColor:
                      remainingSeconds <= 5 ? colors.warning : colors.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.readingTimerRow}>
              <View style={styles.readingTimerLabelWrap}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.textMuted}
                />
                <Text style={styles.readingTimerLabel}>
                  Tempo para leitura das respostas
                </Text>
              </View>
              <Text style={styles.readingTimerValue}>
                {formatTimer(remainingSeconds)}
              </Text>
            </View>
          </View>
        ) : null}

        <Button
          label="Avançar para votação"
          onPress={advanceOnce}
          icon={
            <Ionicons
              name="checkmark-done-outline"
              size={20}
              color={colors.white}
            />
          }
        />
      </View>
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
    headerLeft: {
      flex: 1,
    },
    eyebrow: {
      color: colors.primaryText,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.4,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginTop: 2,
    },
    exitButton: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.75,
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
    stickyActionButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 8,
      minHeight: 36,
      justifyContent: "center",
    },
    stickyActionButtonText: {
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
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.xxl,
      gap: SPACING.xl,
    },
    timerSection: {
      alignItems: "center",
      paddingTop: SPACING.xs,
    },
    starterCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },
    starterTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    starterEyebrow: {
      color: colors.primaryText,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
    },
    starterName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginTop: 2,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.xl,
      padding: SPACING.xxl,
      alignItems: "center",
    },
    heroIconCircle: {
      width: 72,
      height: 72,
      borderRadius: RADIUS.full,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.lg,
    },
    categoryPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
      marginBottom: SPACING.lg,
    },
    categoryPillText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "700",
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: SPACING.sm,
    },
    heroDescription: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: SPACING.lg,
    },
    infoBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.warningSoft,
      borderWidth: 1,
      borderColor: colors.warningBorder,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    infoBannerText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    playersSection: {
      gap: SPACING.md,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
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
      maxWidth: "100%",
    },
    playerChipStarter: {
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primarySoft,
    },
    playerName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
      flexShrink: 1,
    },
    starterBadge: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
    },
    starterBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "800",
    },
    questionRevealCard: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.warningBorder,
      borderRadius: RADIUS.xl,
      padding: SPACING.xl,
      alignItems: "center",
    },
    questionRevealEyebrow: {
      color: colors.warning,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.4,
      marginBottom: SPACING.xs,
    },
    questionRevealText: {
      color: colors.textPrimary,
      fontSize: 19,
      lineHeight: 26,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: SPACING.lg,
    },
    answersHeaderRow: {
      gap: 2,
    },
    answersSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    answersList: {
      gap: SPACING.sm,
    },
    answerCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    answerPlayerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    answerPlayerName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      flex: 1,
    },
    answerValue: {
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 21,
      backgroundColor: colors.surfaceElevated,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    footer: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
      gap: SPACING.sm,
    },
    readingTimerContainer: {
      gap: 6,
      marginBottom: 2,
    },
    readingTimerTrack: {
      height: 3,
      borderRadius: RADIUS.full,
      backgroundColor: colors.borderSubtle,
      overflow: "hidden",
    },
    readingTimerFill: {
      height: "100%",
      borderRadius: RADIUS.full,
    },
    readingTimerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
    },
    readingTimerLabelWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    readingTimerLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "500",
    },
    readingTimerValue: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
  });
