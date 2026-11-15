import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GAMES_BY_ID } from "@/constants/games";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { ActiveRoundState } from "@/types/game";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const game = GAMES_BY_ID[round.prompt.gameId];
  const impostorCount = round.settingsSnapshot.impostorCount;
  const isImpostorGame = round.prompt.gameId === "impostor";

  const handleConfirmAdvance = () => {
    setConfirmModalVisible(false);
    onAdvanceToVoting();
  };

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
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle} accessible={false}>
            <Ionicons
              name="chatbubbles-outline"
              size={34}
              color={COLORS.primaryText}
            />
          </View>

          <View style={styles.categoryPill}>
            <Ionicons
              name="pricetag-outline"
              size={14}
              color={COLORS.primaryText}
            />
            <Text style={styles.categoryPillText}>
              Categoria: {round.prompt.categoryName}
            </Text>
          </View>

          <Text style={styles.heroTitle}>Hora de jogar presencialmente!</Text>
          <Text style={styles.heroDescription}>
            {isImpostorGame
              ? "Em roda, cada jogador deve falar uma palavra ou dica relacionada à palavra secreta, sem entregá-la de bandeja. O impostor precisa disfarçar!"
              : "Todos respondem em voz alta à pergunta que receberam! Comparem as respostas e observem quem parece ter recebido uma pergunta diferente."}
          </Text>

          <View style={styles.infoBanner}>
            <Ionicons name="eye-off-outline" size={16} color={COLORS.warning} />
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
            {round.assignments.map(({ player }) => (
              <View key={player.id} style={styles.playerChip}>
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  size={28}
                />
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Avançar para votação"
          onPress={() => setConfirmModalVisible(true)}
          icon={
            <Ionicons
              name="checkmark-done-outline"
              size={20}
              color={COLORS.white}
            />
          }
        />
      </View>

      <ConfirmModal
        visible={confirmModalVisible}
        title="Avançar para a votação?"
        message={
          isImpostorGame
            ? "Confirme apenas quando todos os jogadores já tiverem falado suas dicas."
            : "Confirme apenas quando todos os jogadores já tiverem respondido à pergunta."
        }
        confirmLabel="Ir para votação"
        cancelLabel="Continuar jogando"
        iconName="people-outline"
        onConfirm={handleConfirmAdvance}
        onCancel={() => setConfirmModalVisible(false)}
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
  headerLeft: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.primaryText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  exitButton: {
    width: 40,
    height: 40,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xl,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(139, 61, 255, 0.35)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginBottom: SPACING.lg,
  },
  categoryPillText: {
    color: COLORS.primaryText,
    fontSize: 13,
    fontWeight: "700",
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  heroDescription: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  infoBannerText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  playersSection: {
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    maxWidth: "48%",
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
});
