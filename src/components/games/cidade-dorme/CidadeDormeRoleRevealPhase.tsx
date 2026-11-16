import { SecretRevealCard } from "@/components/games/SecretRevealCard";
import { RoleBadgeIcon } from "@/components/games/cidade-dorme/RoleBadgeIcon";
import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { Button } from "@/components/ui/Button";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import { usePressHoldReveal } from "@/hooks/usePressHoldReveal";
import { CidadeDormeMatchState } from "@/types/cidadeDorme";
import { CIDADE_DORME_ROLE_META } from "@/utils/cidadeDormeEngine";
import { formatPlayerNames } from "@/utils/gameEngine";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface CidadeDormeRoleRevealPhaseProps {
  match: CidadeDormeMatchState;
  onCompleteReveal: () => void;
  onRequestExit: () => void;
}

export function CidadeDormeRoleRevealPhase({
  match,
  onCompleteReveal,
  onRequestExit,
}: CidadeDormeRoleRevealPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { triggerCardReveal, triggerCardHide, triggerLightImpact } =
    useHaptics();

  const {
    isHolding,
    hasViewed,
    handlePressIn,
    handlePressOut,
    handleTouchEnd,
    resetReveal,
  } = usePressHoldReveal({
    onReveal: triggerCardReveal,
    onHide: triggerCardHide,
  });

  const totalPlayers = match.players.length;
  const currentEntry = match.players[currentIndex];
  const isLastPlayer = currentIndex >= totalPlayers - 1;

  if (!currentEntry) {
    return null;
  }

  const roleMeta = CIDADE_DORME_ROLE_META[currentEntry.role];
  const partnerAssassins =
    currentEntry.role === "assassin"
      ? match.players
          .filter(
            (entry) =>
              entry.role === "assassin" &&
              entry.player.id !== currentEntry.player.id,
          )
          .map((entry) => entry.player)
      : [];

  const handleNextPlayer = () => {
    triggerLightImpact();
    resetReveal();
    if (isLastPlayer) {
      onCompleteReveal();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

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
            {match.players.map((entry, index) => (
              <View
                key={entry.player.id}
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
      <AnimatedPhaseView
        key={`cd-player-header-${currentEntry.player.id}`}
        variant="slide-right"
        duration={220}
      >
        <View style={styles.playerHeader}>
          <Text style={styles.eyebrow}>DISTRIBUIÇÃO DE PAPÉIS</Text>
          <Text style={styles.playerName} numberOfLines={1}>
            {currentEntry.player.name}
          </Text>
          <Text style={styles.playerSubtitle}>
            Só você pode ver esta carta.
          </Text>
        </View>
      </AnimatedPhaseView>

      {/* Press-and-hold secret role card */}
      <View style={styles.cardArea}>
        <SecretRevealCard
          cardKey={currentEntry.player.id}
          isHolding={isHolding}
          accessibilityLabel={`Carta secreta de ${currentEntry.player.name}. Pressione e segure para revelar.`}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handlePressOut}
          renderCornerIcon={(color) => (
            <Ionicons name="moon-outline" size={18} color={color} />
          )}
          revealedAccentColor={roleMeta.accentColor}
          revealedBorderColor={roleMeta.borderColor}
          hiddenHint="Pressione e segure este card para descobrir seu papel. Ao soltar, ele volta a ocultar."
          revealedContent={
            <>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: roleMeta.softBgColor },
                ]}
                accessible={false}
              >
                <RoleBadgeIcon
                  role={currentEntry.role}
                  size={42}
                  color={roleMeta.accentColor}
                />
              </View>

              <Text
                style={[styles.rolePreTitle, { color: roleMeta.accentColor }]}
              >
                Seu papel é
              </Text>
              <Text style={[styles.roleTitle, { color: roleMeta.accentColor }]}>
                {roleMeta.title.toUpperCase()}
              </Text>

              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: roleMeta.accentColor },
                ]}
              />

              <Text style={styles.roleDescription}>
                {roleMeta.revealDescription}
              </Text>

              {currentEntry.role === "assassin" ? (
                <View style={styles.partnerBox}>
                  <Text style={styles.partnerLabel}>
                    {partnerAssassins.length > 0
                      ? partnerAssassins.length > 1
                        ? "SEUS PARCEIROS"
                        : "SEU PARCEIRO"
                      : "ATUAÇÃO"}
                  </Text>
                  <Text style={styles.partnerValue}>
                    {partnerAssassins.length > 0
                      ? formatPlayerNames(partnerAssassins)
                      : "Você é o único assassino"}
                  </Text>
                </View>
              ) : null}
            </>
          }
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.lockRow}>
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={hasViewed ? COLORS.textSecondary : COLORS.primaryText}
          />
          <Text
            style={[styles.lockText, !hasViewed && styles.lockTextHighlight]}
          >
            {hasViewed
              ? "Memorize seu papel antes de passar o celular."
              : "Segure o card acima para ver seu papel antes de continuar."}
          </Text>
        </View>

        <Button
          label={
            isLastPlayer
              ? "Iniciar primeira noite"
              : "Passar para o próximo jogador"
          }
          onPress={handleNextPlayer}
          disabled={!hasViewed}
          icon={
            <Ionicons
              name={isLastPlayer ? "moon-outline" : "arrow-forward-outline"}
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
    marginBottom: SPACING.md,
  },
  eyebrow: {
    color: COLORS.primaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 4,
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
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  rolePreTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  roleTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginTop: 2,
    textAlign: "center",
  },
  dividerLine: {
    width: 32,
    height: 3,
    borderRadius: RADIUS.full,
    marginVertical: SPACING.md,
  },
  roleDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 270,
  },
  partnerBox: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.35)",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    gap: 2,
  },
  partnerLabel: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  partnerValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
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
