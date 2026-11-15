import { RoleBadgeIcon } from "@/components/games/cidade-dorme/RoleBadgeIcon";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  CIDADE_DORME_THEMES,
  COLORS,
  RADIUS,
  SPACING,
} from "@/constants/theme";
import {
  CidadeDormeMatchState,
  CidadeDormePlayerState,
} from "@/types/cidadeDorme";
import { CIDADE_DORME_ROLE_META } from "@/utils/cidadeDormeEngine";
import { formatPlayerNames } from "@/utils/gameEngine";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const NIGHT = CIDADE_DORME_THEMES.night;

export interface NightCompletionPayload {
  assassinVotes: Record<string, string>;
  guardianTargetIds: string[];
  detectiveInvestigatedIds: string[];
}

interface CidadeDormeNightPhaseProps {
  match: CidadeDormeMatchState;
  startAtPass?: boolean;
  onBeginNightPass: () => void;
  onCompleteNight: (payload: NightCompletionPayload) => void;
  onRequestExit: () => void;
}

export function CidadeDormeNightPhase({
  match,
  startAtPass = false,
  onBeginNightPass,
  onCompleteNight,
  onRequestExit,
}: CidadeDormeNightPhaseProps) {
  const alivePlayers = useMemo(
    () => match.players.filter((entry) => entry.alive),
    [match.players],
  );

  const [inPassStage, setInPassStage] = useState(startAtPass);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [detectiveRevealedId, setDetectiveRevealedId] = useState<string | null>(
    null,
  );

  const [assassinVotes, setAssassinVotes] = useState<Record<string, string>>(
    {},
  );
  const [guardianTargetIds, setGuardianTargetIds] = useState<string[]>([]);
  const [detectiveInvestigatedIds, setDetectiveInvestigatedIds] = useState<
    string[]
  >([]);

  const currentEntry = alivePlayers[playerIndex];
  const isLastPlayer = playerIndex >= alivePlayers.length - 1;

  const advanceTurn = (
    nextAssassinVotes: Record<string, string>,
    nextGuardianIds: string[],
    nextDetectiveIds: string[],
  ) => {
    setIsUnlocked(false);
    setSelectedTargetId(null);
    setDetectiveRevealedId(null);

    if (isLastPlayer) {
      onCompleteNight({
        assassinVotes: nextAssassinVotes,
        guardianTargetIds: nextGuardianIds,
        detectiveInvestigatedIds: nextDetectiveIds,
      });
      return;
    }

    setPlayerIndex((prev) => prev + 1);
  };

  if (!inPassStage) {
    const firstPlayer = alivePlayers[0];
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.nightPill}>
            <Ionicons name="moon" size={14} color={NIGHT.accent} />
            <Text style={styles.nightPillText}>NOITE {match.roundNumber}</Text>
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

        <View style={styles.introCenter}>
          <View style={styles.moonHeroCircle} accessible={false}>
            <Ionicons name="moon" size={48} color={NIGHT.accent} />
          </View>

          <Text style={styles.introTitle}>Cidade Dorme!</Text>
          <Text style={styles.introSubtitle}>A cidade vai dormir...</Text>

          <View style={styles.introCard}>
            <Text style={styles.introCardText}>
              Todos fecham os olhos. O celular vai passar de mão em mão em
              privado para que cada jogador realize sua ação noturna (ou
              descanse sem dar pistas).
            </Text>
            <View style={styles.aliveCountBadge}>
              <Ionicons name="people-outline" size={15} color={NIGHT.accent} />
              <Text style={styles.aliveCountText}>
                {alivePlayers.length} jogadores vivos esta noite
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={
              firstPlayer
                ? `Passar para ${firstPlayer.player.name}`
                : "Começar a noite"
            }
            onPress={() => {
              onBeginNightPass();
              setInPassStage(true);
            }}
            style={styles.nightPrimaryButton}
            icon={
              <Ionicons name="moon-outline" size={20} color={COLORS.white} />
            }
          />
        </View>
      </View>
    );
  }

  if (!currentEntry) {
    return null;
  }

  // Handoff privacy screen (identical for every role)
  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <NightPassHeader
          roundNumber={match.roundNumber}
          currentIndex={playerIndex}
          totalPlayers={alivePlayers.length}
          onRequestExit={onRequestExit}
        />

        <View style={styles.handoffCenter}>
          <View style={styles.handoffCard}>
            <View style={styles.handoffMoonBadge} accessible={false}>
              <Ionicons name="moon-outline" size={20} color={NIGHT.accent} />
            </View>

            <PlayerAvatar
              name={currentEntry.player.name}
              color={currentEntry.player.color}
              size={64}
            />

            <Text style={styles.handoffOverline}>VEZ PRIVADA NA NOITE</Text>
            <Text style={styles.handoffPlayerName} numberOfLines={1}>
              {currentEntry.player.name}
            </Text>
            <Text style={styles.handoffHint}>
              Entregue o celular para{" "}
              <Text style={styles.handoffHintBold}>
                {currentEntry.player.name}
              </Text>
              . Garanta que mais ninguém está olhando a tela.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={`Sou ${currentEntry.player.name}`}
            onPress={() => setIsUnlocked(true)}
            style={styles.nightPrimaryButton}
            icon={
              <Ionicons
                name="lock-open-outline"
                size={20}
                color={COLORS.white}
              />
            }
          />
        </View>
      </View>
    );
  }

  // Private role action view
  const roleMeta = CIDADE_DORME_ROLE_META[currentEntry.role];

  if (currentEntry.role === "citizen") {
    return (
      <View style={styles.container}>
        <NightPassHeader
          roundNumber={match.roundNumber}
          currentIndex={playerIndex}
          totalPlayers={alivePlayers.length}
          onRequestExit={onRequestExit}
        />

        <View style={styles.handoffCenter}>
          <View style={styles.sleepCard}>
            <View style={styles.sleepIconCircle} accessible={false}>
              <Ionicons
                name="cloudy-night-outline"
                size={42}
                color={NIGHT.accent}
              />
            </View>

            <View
              style={[
                styles.rolePill,
                {
                  backgroundColor: roleMeta.softBgColor,
                  borderColor: roleMeta.borderColor,
                },
              ]}
            >
              <Text
                style={[styles.rolePillText, { color: roleMeta.accentColor }]}
              >
                CIDADÃO
              </Text>
            </View>

            <Text style={styles.sleepTitle}>
              Você dorme profundamente esta noite.
            </Text>
            <Text style={styles.sleepSubtitle}>
              Aguarde alguns segundos se preferir para não denunciar seu papel e
              toque abaixo para passar o aparelho.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Toque para passar"
            onPress={() =>
              advanceTurn(
                assassinVotes,
                guardianTargetIds,
                detectiveInvestigatedIds,
              )
            }
            style={styles.nightPrimaryButton}
            icon={
              <Ionicons
                name={isLastPlayer ? "sunny-outline" : "arrow-forward-outline"}
                size={20}
                color={COLORS.white}
              />
            }
          />
        </View>
      </View>
    );
  }

  if (currentEntry.role === "detective") {
    const detectiveTargets = alivePlayers.filter(
      (entry) => entry.player.id !== currentEntry.player.id,
    );
    const revealedTarget = detectiveRevealedId
      ? match.players.find((entry) => entry.player.id === detectiveRevealedId)
      : undefined;

    if (revealedTarget) {
      const isAssassin = revealedTarget.role === "assassin";
      return (
        <View style={styles.container}>
          <NightPassHeader
            roundNumber={match.roundNumber}
            currentIndex={playerIndex}
            totalPlayers={alivePlayers.length}
            onRequestExit={onRequestExit}
          />

          <View style={styles.handoffCenter}>
            <View
              style={[
                styles.verdictCard,
                isAssassin
                  ? styles.verdictAssassinCard
                  : styles.verdictInnocentCard,
              ]}
            >
              <Text style={styles.verdictEyebrow}>
                RESULTADO DA INVESTIGAÇÃO
              </Text>

              <PlayerAvatar
                name={revealedTarget.player.name}
                color={revealedTarget.player.color}
                size={58}
              />

              <Text style={styles.verdictPlayerName}>
                {revealedTarget.player.name}
              </Text>

              <View
                style={[
                  styles.verdictBadge,
                  {
                    backgroundColor: isAssassin
                      ? COLORS.dangerSoft
                      : COLORS.successSoft,
                    borderColor: isAssassin
                      ? "rgba(244, 63, 94, 0.45)"
                      : "rgba(16, 185, 129, 0.45)",
                  },
                ]}
              >
                <Ionicons
                  name={
                    isAssassin ? "warning-outline" : "shield-checkmark-outline"
                  }
                  size={20}
                  color={isAssassin ? COLORS.danger : COLORS.success}
                />
                <Text
                  style={[
                    styles.verdictBadgeText,
                    { color: isAssassin ? COLORS.danger : COLORS.success },
                  ]}
                >
                  {isAssassin ? "ASSASSINO" : "INOCENTE"}
                </Text>
              </View>

              <Text style={styles.verdictNote}>
                {isAssassin
                  ? "Cuidado! Esta pessoa é um dos assassinos da cidade."
                  : "Esta pessoa é inocente (não faz parte dos assassinos)."}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              label={isLastPlayer ? "Entendi, amanhecer" : "Entendi, passar"}
              onPress={() =>
                advanceTurn(
                  assassinVotes,
                  guardianTargetIds,
                  detectiveInvestigatedIds,
                )
              }
              style={styles.nightPrimaryButton}
              icon={
                <Ionicons
                  name={
                    isLastPlayer ? "sunny-outline" : "arrow-forward-outline"
                  }
                  size={20}
                  color={COLORS.white}
                />
              }
            />
          </View>
        </View>
      );
    }

    return (
      <NightTargetSelectionView
        match={match}
        playerIndex={playerIndex}
        totalPlayers={alivePlayers.length}
        role="detective"
        title="Escolha quem investigar"
        subtitle="Você descobrirá imediatamente se a pessoa investigada é inocente ou assassina."
        targets={detectiveTargets}
        selectedTargetId={selectedTargetId}
        onSelectTarget={setSelectedTargetId}
        detectiveKnowledge={match.detectiveKnowledge}
        confirmLabel="Investigar jogador"
        onConfirm={() => {
          if (!selectedTargetId) return;
          setDetectiveInvestigatedIds((prev) => [...prev, selectedTargetId]);
          setDetectiveRevealedId(selectedTargetId);
        }}
        onRequestExit={onRequestExit}
      />
    );
  }

  if (currentEntry.role === "guardian_angel") {
    return (
      <NightTargetSelectionView
        match={match}
        playerIndex={playerIndex}
        totalPlayers={alivePlayers.length}
        role="guardian_angel"
        title="Escolha quem proteger"
        subtitle="Se os assassinos atacarem esta pessoa nesta noite, ninguém morrerá."
        targets={alivePlayers}
        selfPlayerId={currentEntry.player.id}
        selectedTargetId={selectedTargetId}
        onSelectTarget={setSelectedTargetId}
        confirmLabel={
          isLastPlayer ? "Proteger e amanhecer" : "Proteger e passar"
        }
        onConfirm={() => {
          if (!selectedTargetId) return;
          const nextGuardianIds = [...guardianTargetIds, selectedTargetId];
          setGuardianTargetIds(nextGuardianIds);
          advanceTurn(assassinVotes, nextGuardianIds, detectiveInvestigatedIds);
        }}
        onRequestExit={onRequestExit}
      />
    );
  }

  // Assassin turn
  const partnerAssassins = match.players.filter(
    (entry) =>
      entry.role === "assassin" && entry.player.id !== currentEntry.player.id,
  );
  const alivePartners = partnerAssassins.filter((entry) => entry.alive);
  const assassinTargets = alivePlayers.filter(
    (entry) => entry.role !== "assassin",
  );

  const partnerVotedIds = new Map<string, string[]>();
  for (const partner of alivePartners) {
    const targetId = assassinVotes[partner.player.id];
    if (targetId) {
      const names = partnerVotedIds.get(targetId) ?? [];
      names.push(partner.player.name);
      partnerVotedIds.set(targetId, names);
    }
  }

  const partnerSubtitle =
    alivePartners.length > 0
      ? `Parceiro(s) vivo(s): ${formatPlayerNames(alivePartners.map((p) => p.player))}. Escolha a vítima desta noite.`
      : "Escolha quem você deseja atacar esta noite.";

  return (
    <NightTargetSelectionView
      match={match}
      playerIndex={playerIndex}
      totalPlayers={alivePlayers.length}
      role="assassin"
      title="Escolha uma vítima"
      subtitle={partnerSubtitle}
      targets={assassinTargets}
      selectedTargetId={selectedTargetId}
      onSelectTarget={setSelectedTargetId}
      partnerVotesByTarget={partnerVotedIds}
      confirmLabel={
        isLastPlayer ? "Confirmar alvo e amanhecer" : "Confirmar alvo e passar"
      }
      onConfirm={() => {
        if (!selectedTargetId) return;
        const nextVotes = {
          ...assassinVotes,
          [currentEntry.player.id]: selectedTargetId,
        };
        setAssassinVotes(nextVotes);
        advanceTurn(nextVotes, guardianTargetIds, detectiveInvestigatedIds);
      }}
      onRequestExit={onRequestExit}
    />
  );
}

interface NightPassHeaderProps {
  roundNumber: number;
  currentIndex: number;
  totalPlayers: number;
  onRequestExit: () => void;
}

function NightPassHeader({
  roundNumber,
  currentIndex,
  totalPlayers,
  onRequestExit,
}: NightPassHeaderProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.nightPill}>
        <Ionicons name="moon" size={13} color={NIGHT.accent} />
        <Text style={styles.nightPillText}>NOITE {roundNumber}</Text>
      </View>

      <View style={styles.progressBlock}>
        <Text style={styles.progressLabel}>
          {currentIndex + 1} de {totalPlayers}
        </Text>
        <View style={styles.progressTrack} accessible={false}>
          {Array.from({ length: totalPlayers }).map((_, index) => (
            <View
              key={index}
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
        style={({ pressed }) => [styles.exitButton, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons name="close" size={20} color={COLORS.textSecondary} />
      </Pressable>
    </View>
  );
}

interface NightTargetSelectionViewProps {
  match: CidadeDormeMatchState;
  playerIndex: number;
  totalPlayers: number;
  role: "assassin" | "detective" | "guardian_angel";
  title: string;
  subtitle: string;
  targets: readonly CidadeDormePlayerState[];
  selfPlayerId?: string;
  selectedTargetId: string | null;
  onSelectTarget: (id: string) => void;
  detectiveKnowledge?: Record<string, "assassin" | "innocent">;
  partnerVotesByTarget?: Map<string, string[]>;
  confirmLabel: string;
  onConfirm: () => void;
  onRequestExit: () => void;
}

function NightTargetSelectionView({
  match,
  playerIndex,
  totalPlayers,
  role,
  title,
  subtitle,
  targets,
  selfPlayerId,
  selectedTargetId,
  onSelectTarget,
  detectiveKnowledge,
  partnerVotesByTarget,
  confirmLabel,
  onConfirm,
  onRequestExit,
}: NightTargetSelectionViewProps) {
  const roleMeta = CIDADE_DORME_ROLE_META[role];

  return (
    <View style={styles.container}>
      <NightPassHeader
        roundNumber={match.roundNumber}
        currentIndex={playerIndex}
        totalPlayers={totalPlayers}
        onRequestExit={onRequestExit}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.actionScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionHeaderCard}>
          <View
            style={[
              styles.actionIconCircle,
              { backgroundColor: roleMeta.softBgColor },
            ]}
            accessible={false}
          >
            <RoleBadgeIcon role={role} size={30} color={roleMeta.accentColor} />
          </View>

          <View
            style={[
              styles.rolePill,
              {
                backgroundColor: roleMeta.softBgColor,
                borderColor: roleMeta.borderColor,
              },
            ]}
          >
            <Text
              style={[styles.rolePillText, { color: roleMeta.accentColor }]}
            >
              {roleMeta.title.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>

        <View style={styles.targetsGrid}>
          {targets.map((entry) => {
            const isSelected = selectedTargetId === entry.player.id;
            const isSelf = selfPlayerId === entry.player.id;
            const knownResult = detectiveKnowledge?.[entry.player.id];
            const partnerVoters = partnerVotesByTarget?.get(entry.player.id);

            return (
              <Pressable
                key={entry.player.id}
                onPress={() => onSelectTarget(entry.player.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Selecionar ${entry.player.name}`}
                style={({ pressed }) => [
                  styles.targetCard,
                  isSelected && {
                    borderColor: roleMeta.accentColor,
                    backgroundColor: roleMeta.softBgColor,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.targetCardTop}>
                  <PlayerAvatar
                    name={entry.player.name}
                    color={entry.player.color}
                    size={36}
                  />
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && {
                        backgroundColor: roleMeta.accentColor,
                        borderColor: roleMeta.accentColor,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={NIGHT.background}
                      />
                    ) : null}
                  </View>
                </View>

                <Text style={styles.targetName} numberOfLines={1}>
                  {entry.player.name}
                  {isSelf ? " (Você)" : ""}
                </Text>

                {knownResult ? (
                  <Text
                    style={[
                      styles.targetTag,
                      {
                        color:
                          knownResult === "assassin"
                            ? COLORS.danger
                            : COLORS.success,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {knownResult === "assassin"
                      ? "Já visto: Assassino"
                      : "Já visto: Inocente"}
                  </Text>
                ) : null}

                {partnerVoters && partnerVoters.length > 0 ? (
                  <Text style={styles.partnerVoteTag} numberOfLines={1}>
                    Voto: {partnerVoters.join(", ")}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={confirmLabel}
          onPress={onConfirm}
          disabled={!selectedTargetId}
          style={styles.nightPrimaryButton}
          icon={<Ionicons name="checkmark" size={20} color={COLORS.white} />}
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
  nightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: NIGHT.accentSoft,
    borderWidth: 1,
    borderColor: NIGHT.accentBorder,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  nightPillText: {
    color: NIGHT.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  progressBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    maxWidth: 150,
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    minWidth: 3,
    maxWidth: 16,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: NIGHT.border,
  },
  progressSegmentActive: {
    backgroundColor: NIGHT.accent,
  },
  exitButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: NIGHT.surface,
    borderWidth: 1,
    borderColor: NIGHT.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.78,
  },
  introCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: SPACING.xl,
  },
  moonHeroCircle: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: NIGHT.accentSoft,
    borderWidth: 1.5,
    borderColor: NIGHT.accentBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  introTitle: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  introSubtitle: {
    color: NIGHT.accent,
    fontSize: 17,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: SPACING.xxl,
    textAlign: "center",
  },
  introCard: {
    width: "100%",
    backgroundColor: NIGHT.surface,
    borderWidth: 1,
    borderColor: NIGHT.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.lg,
  },
  introCardText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  aliveCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: NIGHT.surfaceElevated,
    borderWidth: 1,
    borderColor: NIGHT.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  aliveCountText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  handoffCenter: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  handoffCard: {
    backgroundColor: NIGHT.surface,
    borderWidth: 1,
    borderColor: NIGHT.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    gap: SPACING.md,
  },
  handoffMoonBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: NIGHT.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  handoffOverline: {
    color: NIGHT.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: SPACING.xs,
  },
  handoffPlayerName: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  handoffHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 270,
  },
  handoffHintBold: {
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  sleepCard: {
    backgroundColor: NIGHT.surface,
    borderWidth: 1,
    borderColor: NIGHT.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    gap: SPACING.md,
  },
  sleepIconCircle: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.full,
    backgroundColor: NIGHT.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  rolePill: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sleepTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 29,
  },
  sleepSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 270,
  },
  verdictCard: {
    backgroundColor: NIGHT.surface,
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    gap: SPACING.md,
  },
  verdictAssassinCard: {
    borderColor: "rgba(244, 63, 94, 0.45)",
  },
  verdictInnocentCard: {
    borderColor: "rgba(16, 185, 129, 0.45)",
  },
  verdictEyebrow: {
    color: NIGHT.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  verdictPlayerName: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  verdictBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
  },
  verdictBadgeText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  verdictNote: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 260,
  },
  scroll: {
    flex: 1,
  },
  actionScrollContent: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  actionHeaderCard: {
    backgroundColor: NIGHT.surface,
    borderWidth: 1,
    borderColor: NIGHT.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.sm,
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  actionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  targetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  targetCard: {
    width: "48%",
    backgroundColor: NIGHT.surface,
    borderWidth: 1.5,
    borderColor: NIGHT.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  targetCardTop: {
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
  targetName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  targetTag: {
    fontSize: 11,
    fontWeight: "700",
  },
  partnerVoteTag: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: NIGHT.borderSubtle,
  },
  nightPrimaryButton: {
    backgroundColor: "#2563EB",
  },
});
