import { Button } from "@/components/ui/Button";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { ActiveRoundState } from "@/types/game";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  AppState,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PRESS_RETENTION_OFFSET = { top: 40, left: 40, bottom: 40, right: 40 };

interface SecretRolePhaseProps {
  round: ActiveRoundState;
  onCompleteReveal: () => void;
  onRequestExit: () => void;
}

export function SecretRolePhase({
  round,
  onCompleteReveal,
  onRequestExit,
}: SecretRolePhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [hasViewedCurrent, setHasViewedCurrent] = useState(false);

  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    setHasViewedCurrent(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsHolding(false);
  }, []);

  const handleTouchEnd = useCallback((event: GestureResponderEvent) => {
    if ((event.nativeEvent.touches?.length ?? 0) === 0) {
      setIsHolding(false);
    }
  }, []);

  // Hide immediately if the app loses focus or goes to background.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        setIsHolding(false);
      }
    });

    return () => subscription.remove();
  }, []);

  // On web, ensure releasing outside the card or browser window always hides.
  useEffect(() => {
    if (Platform.OS !== "web" || !isHolding || typeof window === "undefined") {
      return;
    }

    const handleGlobalRelease = () => setIsHolding(false);
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.hidden) {
        setIsHolding(false);
      }
    };

    window.addEventListener("pointerup", handleGlobalRelease);
    window.addEventListener("pointercancel", handleGlobalRelease);
    window.addEventListener("mouseup", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);
    window.addEventListener("touchcancel", handleGlobalRelease);
    window.addEventListener("blur", handleGlobalRelease);
    window.addEventListener("contextmenu", handleGlobalRelease);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("pointerup", handleGlobalRelease);
      window.removeEventListener("pointercancel", handleGlobalRelease);
      window.removeEventListener("mouseup", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
      window.removeEventListener("touchcancel", handleGlobalRelease);
      window.removeEventListener("blur", handleGlobalRelease);
      window.removeEventListener("contextmenu", handleGlobalRelease);
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }
    };
  }, [isHolding]);

  const totalPlayers = round.assignments.length;
  const currentAssignment = round.assignments[currentIndex];
  const isLastPlayer = currentIndex >= totalPlayers - 1;

  if (!currentAssignment) {
    return null;
  }

  const isImpostor = currentAssignment.role === "impostor";
  const { prompt } = round;

  const handleNextPlayer = () => {
    setIsHolding(false);
    if (isLastPlayer) {
      onCompleteReveal();
      return;
    }

    setHasViewedCurrent(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const cardAccent = !isHolding
    ? COLORS.primaryText
    : isImpostor
      ? COLORS.danger
      : COLORS.success;

  const cardBorderColor = !isHolding
    ? COLORS.border
    : isImpostor
      ? "rgba(244, 63, 94, 0.45)"
      : "rgba(16, 185, 129, 0.45)";

  const badgeBgColor = !isHolding
    ? COLORS.primarySoft
    : isImpostor
      ? COLORS.dangerSoft
      : COLORS.successSoft;

  return (
    <View style={styles.container}>
      {/* Top progress & exit */}
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />

        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>
            Jogador {currentIndex + 1} de {totalPlayers}
          </Text>
          <View style={styles.progressTrack} accessible={false}>
            {round.assignments.map((assignment, index) => (
              <View
                key={assignment.player.id}
                style={[
                  styles.progressSegment,
                  index <= currentIndex && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
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
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {/* Player header */}
      <View style={styles.playerHeader}>
        <Text style={styles.playerName} numberOfLines={1}>
          {currentAssignment.player.name}
        </Text>
        <Text style={styles.playerSubtitle}>Só você pode ver esta carta.</Text>
      </View>

      {/* Central press-and-hold card */}
      <View style={styles.cardArea}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handlePressOut}
          cancelable={false}
          pressRetentionOffset={PRESS_RETENTION_OFFSET}
          pointerEvents="box-only"
          accessibilityRole="button"
          accessibilityLabel={`Carta secreta de ${currentAssignment.player.name}. Pressione e segure para revelar.`}
          style={[
            styles.outerCard,
            { borderColor: cardBorderColor },
            isHolding && styles.outerCardPressed,
          ]}
        >
          <View
            pointerEvents="none"
            style={[styles.innerFrame, { borderColor: cardBorderColor }]}
          >
            <View style={styles.cardTopRow}>
              <MaterialCommunityIcons
                name="drama-masks"
                size={18}
                color={cardAccent}
              />
              <Text style={styles.cardTag}>PAPEL SECRETO</Text>
              <View style={styles.cardCornerPlaceholder} />
            </View>

            {!isHolding ? (
              <View style={styles.cardCenter}>
                <View
                  style={[styles.iconCircle, { backgroundColor: badgeBgColor }]}
                  accessible={false}
                >
                  <Ionicons
                    name="finger-print-outline"
                    size={42}
                    color={COLORS.primaryText}
                  />
                </View>

                <Text style={styles.hiddenTitle}>Segure para revelar</Text>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: COLORS.primary },
                  ]}
                />
                <Text style={styles.hiddenHint}>
                  Pressione e segure este card para ver seu papel. Ao soltar,
                  ele volta a ocultar.
                </Text>
              </View>
            ) : (
              <View style={styles.cardCenter}>
                <View
                  style={[styles.iconCircle, { backgroundColor: badgeBgColor }]}
                  accessible={false}
                >
                  {isImpostor ? (
                    <MaterialCommunityIcons
                      name="drama-masks"
                      size={42}
                      color={COLORS.danger}
                    />
                  ) : (
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={40}
                      color={COLORS.success}
                    />
                  )}
                </View>

                <Text style={[styles.rolePreTitle, { color: cardAccent }]}>
                  {isImpostor ? "Você é o" : "Você é"}
                </Text>
                <Text style={[styles.roleTitle, { color: cardAccent }]}>
                  {isImpostor ? "IMPOSTOR!" : "INOCENTE"}
                </Text>

                <View
                  style={[styles.dividerLine, { backgroundColor: cardAccent }]}
                />

                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    Categoria: {prompt.categoryName}
                  </Text>
                </View>

                {prompt.gameId === "impostor" ? (
                  isImpostor ? (
                    <View style={styles.secretBox}>
                      {prompt.impostorHint ? (
                        <>
                          <Text style={styles.secretLabel}>DICA PARA VOCÊ</Text>
                          <Text style={styles.secretValue}>
                            {prompt.impostorHint}
                          </Text>
                          <Text style={styles.impostorSubNote}>
                            Finja que sabe a palavra secreta
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.impostorNoHintText}>
                          Finja que sabe a palavra secreta
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.secretBox}>
                      <Text style={styles.secretLabel}>PALAVRA SECRETA</Text>
                      <Text style={styles.secretValue}>
                        {prompt.secretWord}
                      </Text>
                    </View>
                  )
                ) : (
                  <View style={styles.secretBox}>
                    <Text style={styles.secretLabel}>
                      {isImpostor ? "SUA PERGUNTA (IMPOSTOR)" : "SUA PERGUNTA"}
                    </Text>
                    <Text style={styles.questionValue}>
                      {isImpostor
                        ? prompt.impostorQuestion
                        : prompt.innocentQuestion}
                    </Text>
                    {isImpostor && prompt.impostorHint ? (
                      <Text style={styles.questionHint}>
                        Dica: {prompt.impostorHint}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            )}

            <View style={styles.cardBottomRow}>
              <View style={styles.cardCornerPlaceholder} />
              <Text style={styles.cardTag}>
                {isHolding ? "GUARDE SEU SEGREDO" : "SOLTE PARA OCULTAR"}
              </Text>
              <MaterialCommunityIcons
                name="drama-masks"
                size={18}
                color={cardAccent}
              />
            </View>
          </View>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.lockRow}>
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={hasViewedCurrent ? COLORS.textSecondary : COLORS.primaryText}
          />
          <Text
            style={[
              styles.lockText,
              !hasViewedCurrent && styles.lockTextHighlight,
            ]}
          >
            {hasViewedCurrent
              ? "Mantenha essa informação em segredo."
              : "Segure o card acima para ver seu papel antes de continuar."}
          </Text>
        </View>

        <Button
          label={
            isLastPlayer ? "Ir para a rodada" : "Passar para o próximo jogador"
          }
          onPress={handleNextPlayer}
          disabled={!hasViewedCurrent}
          icon={
            <Ionicons
              name={isLastPlayer ? "play-outline" : "arrow-forward-outline"}
              size={20}
              color={COLORS.white}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  topSpacer: {
    width: 38,
  },
  progressBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: SPACING.xs,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    maxWidth: 220,
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    minWidth: 4,
    maxWidth: 22,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primary,
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
    opacity: 0.75,
  },
  playerHeader: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  playerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  cardArea: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: SPACING.sm,
  },
  outerCard: {
    flex: 1,
    maxHeight: 460,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    padding: 10,
  },
  outerCardPressed: {
    backgroundColor: COLORS.surfaceElevated,
  },
  innerFrame: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardCornerPlaceholder: {
    width: 18,
  },
  cardTag: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  cardCenter: {
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  hiddenTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  hiddenHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 260,
  },
  rolePreTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  roleTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  dividerLine: {
    width: 32,
    height: 3,
    borderRadius: RADIUS.full,
    marginVertical: SPACING.md,
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginBottom: SPACING.md,
  },
  categoryBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  secretBox: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
  },
  secretLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  secretValue: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  impostorNoHintText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    maxWidth: 240,
  },
  impostorSubNote: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  questionValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
  },
  questionHint: {
    color: COLORS.warning,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },
  footer: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  lockText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  lockTextHighlight: {
    color: COLORS.primaryText,
    fontWeight: "600",
  },
});
