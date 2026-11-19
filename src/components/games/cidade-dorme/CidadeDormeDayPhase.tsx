import { RoleBadgeIcon } from "@/components/games/cidade-dorme/RoleBadgeIcon";
import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { Button } from "@/components/ui/Button";
import { CircularTimer, getTimerColor } from "@/components/ui/CircularTimer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { AppTheme, RADIUS, SPACING } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { CidadeDormeMatchState } from "@/types/cidadeDorme";
import {
  CIDADE_DORME_ROLE_META,
  getCidadeDormeRoleVisuals,
} from "@/utils/cidadeDormeEngine";
import { formatTimer } from "@/utils/gameEngine";
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

interface CidadeDormeDayPhaseProps {
  phase: "day-discussion" | "day-voting" | "day-elimination";
  match: CidadeDormeMatchState;
  onAdvanceToVoting: () => void;
  onFinishVoting: (votedPlayerId: string | null) => void;
  onProceedToNextNight: () => void;
  onViewGameOver: () => void;
  onRequestExit: () => void;
}

export function CidadeDormeDayPhase({
  phase,
  match,
  onAdvanceToVoting,
  onFinishVoting,
  onProceedToNextNight,
  onViewGameOver,
  onRequestExit,
}: CidadeDormeDayPhaseProps) {
  const styles = useThemedStyles(createStyles);

  if (phase === "day-discussion") {
    return (
      <AnimatedPhaseView
        key={`day-discussion-${match.roundNumber}`}
        style={styles.animatedFill}
        variant="fade-up"
      >
        <DayDiscussionView
          match={match}
          onAdvanceToVoting={onAdvanceToVoting}
          onViewGameOver={onViewGameOver}
          onRequestExit={onRequestExit}
        />
      </AnimatedPhaseView>
    );
  }

  if (phase === "day-voting") {
    return (
      <AnimatedPhaseView
        key={`day-voting-${match.roundNumber}`}
        style={styles.animatedFill}
        variant="fade-up"
      >
        <DayVotingView
          match={match}
          onFinishVoting={onFinishVoting}
          onRequestExit={onRequestExit}
        />
      </AnimatedPhaseView>
    );
  }

  return (
    <AnimatedPhaseView
      key={`day-elimination-${match.roundNumber}`}
      style={styles.animatedFill}
      variant="pop"
    >
      <DayEliminationView
        match={match}
        onProceedToNextNight={onProceedToNextNight}
        onViewGameOver={onViewGameOver}
        onRequestExit={onRequestExit}
      />
    </AnimatedPhaseView>
  );
}

function DayHeader({
  eyebrow,
  title,
  onRequestExit,
}: {
  eyebrow: string;
  title: string;
  onRequestExit: () => void;
}) {
  const { colors, cidadeDorme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      <View style={styles.dayPill}>
        <Ionicons name="sunny" size={14} color={cidadeDorme.day.accent} />
        <Text style={styles.dayPillText}>{eyebrow}</Text>
      </View>

      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        onPress={onRequestExit}
        accessibilityRole="button"
        accessibilityLabel="Sair da partida"
        style={({ pressed }) => [styles.exitButton, pressed && styles.pressed]}
        hitSlop={8}
      >
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

function DayDiscussionView({
  match,
  onAdvanceToVoting,
  onViewGameOver,
  onRequestExit,
}: {
  match: CidadeDormeMatchState;
  onAdvanceToVoting: () => void;
  onViewGameOver: () => void;
  onRequestExit: () => void;
}) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { colors, cidadeDorme } = useTheme();
  const day = cidadeDorme.day;
  const styles = useThemedStyles(createStyles);

  const alivePlayers = useMemo(
    () => match.players.filter((entry) => entry.alive),
    [match.players],
  );
  const eliminatedPlayers = useMemo(
    () => match.players.filter((entry) => !entry.alive),
    [match.players],
  );

  const summary = match.lastNightSummary;
  const killedEntry = summary?.killedPlayerId
    ? match.players.find((entry) => entry.player.id === summary.killedPlayerId)
    : undefined;
  const wasSaved = summary?.wasSaved ?? false;

  return (
    <View style={styles.container}>
      <DayHeader
        eyebrow={`DIA ${match.roundNumber}`}
        title="Amanhecer"
        onRequestExit={onRequestExit}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dawn announcement card */}
        <View
          style={[
            styles.dawnCard,
            killedEntry
              ? styles.dawnCardDanger
              : wasSaved
                ? styles.dawnCardSaved
                : styles.dawnCardNeutral,
          ]}
        >
          <View
            style={[
              styles.dawnIconCircle,
              {
                backgroundColor: killedEntry
                  ? colors.dangerSoft
                  : wasSaved
                    ? colors.successSoft
                    : day.accentSoft,
              },
            ]}
            accessible={false}
          >
            <Ionicons
              name={
                killedEntry
                  ? "skull-outline"
                  : wasSaved
                    ? "shield-checkmark-outline"
                    : "sunny-outline"
              }
              size={36}
              color={
                killedEntry
                  ? colors.danger
                  : wasSaved
                    ? colors.success
                    : day.accent
              }
            />
          </View>

          <Text style={styles.dawnEyebrow}>A CIDADE ACORDOU!</Text>

          {killedEntry ? (
            <>
              <Text style={styles.dawnTitle}>
                {killedEntry.player.name} foi atacado(a)!
              </Text>
              <View style={styles.victimChip}>
                <PlayerAvatar
                  name={killedEntry.player.name}
                  color={killedEntry.player.color}
                  size={34}
                />
                <View>
                  <Text style={styles.victimName}>
                    {killedEntry.player.name}
                  </Text>
                  <Text style={styles.victimStatus}>
                    Eliminado(a) nesta noite
                  </Text>
                </View>
              </View>
            </>
          ) : wasSaved ? (
            <>
              <Text style={[styles.dawnTitle, { color: colors.success }]}>
                Ninguém morreu esta noite!
              </Text>
              <Text style={styles.dawnDescription}>
                Os assassinos escolheram um alvo, mas o{" "}
                <Text style={styles.boldText}>Anjo da Guarda</Text> protegeu a
                vítima a tempo!
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.dawnTitle}>Noite tranquila!</Text>
              <Text style={styles.dawnDescription}>
                Ninguém foi eliminado durante a noite.
              </Text>
            </>
          )}
        </View>

        {match.winner ? (
          <View style={styles.endgameBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.danger}
            />
            <Text style={styles.endgameBannerText}>
              Com esse resultado, os assassinos igualaram o número de inocentes!
            </Text>
          </View>
        ) : (
          <View style={styles.debateCard}>
            <View style={styles.debateHeader}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={day.accent}
              />
              <Text style={styles.debateTitle}>Debate livre</Text>
            </View>
            <Text style={styles.debateText}>
              Todos abrem os olhos! Conversem em roda, compartilhem suspeitas,
              acusem e defendam-se antes de abrir a votação.
            </Text>
          </View>
        )}

        {/* Alive players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Jogadores vivos ({alivePlayers.length})
          </Text>
          <View style={styles.playersGrid}>
            {alivePlayers.map(({ player }) => (
              <View key={player.id} style={styles.playerChip}>
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  size={28}
                />
                <Text style={styles.playerChipName} numberOfLines={1}>
                  {player.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Eliminated players */}
        {eliminatedPlayers.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitleMuted}>
              Fora da partida ({eliminatedPlayers.length})
            </Text>
            <View style={styles.playersGrid}>
              {eliminatedPlayers.map(({ player, eliminatedPhase }) => (
                <View key={player.id} style={styles.eliminatedChip}>
                  <PlayerAvatar
                    name={player.name}
                    color={player.color}
                    size={26}
                  />
                  <View style={styles.eliminatedInfo}>
                    <Text style={styles.eliminatedChipName} numberOfLines={1}>
                      {player.name}
                    </Text>
                    {eliminatedPhase ? (
                      <Text style={styles.eliminatedChipSub}>
                        {eliminatedPhase.kind === "night"
                          ? `Noite ${eliminatedPhase.round}`
                          : `Dia ${eliminatedPhase.round}`}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {match.winner ? (
          <Button
            label="Ver resultado final"
            onPress={onViewGameOver}
            style={styles.dayPrimaryButton}
            icon={
              <Ionicons name="trophy-outline" size={20} color={colors.white} />
            }
          />
        ) : (
          <Button
            label="Iniciar votação"
            onPress={() => setConfirmVisible(true)}
            style={styles.dayPrimaryButton}
            icon={
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color={colors.white}
              />
            }
          />
        )}
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Abrir votação?"
        message="Confirme quando o grupo estiver pronto para votar em quem será eliminado hoje."
        confirmLabel="Ir para votação"
        cancelLabel="Continuar debate"
        iconName="people-outline"
        onConfirm={() => {
          setConfirmVisible(false);
          onAdvanceToVoting();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
}

function DayVotingView({
  match,
  onFinishVoting,
  onRequestExit,
}: {
  match: CidadeDormeMatchState;
  onFinishVoting: (votedPlayerId: string | null) => void;
  onRequestExit: () => void;
}) {
  const { animationsEnabled } = useAppSettings();
  const { triggerSelection, triggerWarning } = useHaptics();
  const theme = useTheme();
  const { colors, cidadeDorme } = theme;
  const day = cidadeDorme.day;
  const styles = useThemedStyles(createStyles);

  const { votingTimerEnabled, votingDurationSeconds } = match.settingsSnapshot;
  const alivePlayers = useMemo(
    () => match.players.filter((entry) => entry.alive),
    [match.players],
  );

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    votingDurationSeconds,
  );
  const [voteConfirmVisible, setVoteConfirmVisible] = useState(false);
  const [endConfirmVisible, setEndConfirmVisible] = useState(false);
  const [timerBottomY, setTimerBottomY] = useState(190);
  const [showStickyTimer, setShowStickyTimer] = useState(false);

  const selectedPlayerIdRef = useRef<string | null>(null);
  const hasFinishedRef = useRef(false);
  const warnedAtTenRef = useRef(false);
  const [stickyAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    selectedPlayerIdRef.current = selectedPlayerId;
  }, [selectedPlayerId]);

  const finishOnce = useCallback(
    (playerId: string | null) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      setVoteConfirmVisible(false);
      setEndConfirmVisible(false);
      onFinishVoting(playerId);
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
  }, [votingTimerEnabled, match.roundNumber]);

  useEffect(() => {
    if (!votingTimerEnabled) return;
    if (remainingSeconds === 10 && !warnedAtTenRef.current) {
      warnedAtTenRef.current = true;
      triggerWarning();
    }
    if (remainingSeconds === 0) {
      triggerWarning();
      finishOnce(selectedPlayerIdRef.current);
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

  const selectedPlayer = useMemo(
    () =>
      alivePlayers.find((entry) => entry.player.id === selectedPlayerId)
        ?.player ?? null,
    [alivePlayers, selectedPlayerId],
  );

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
  const stickyTranslateY = stickyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  return (
    <View style={styles.container}>
      <DayHeader
        eyebrow={`DIA ${match.roundNumber}`}
        title="Votação do grupo"
        onRequestExit={onRequestExit}
      />

      <View style={styles.scrollWrapper}>
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
          contentContainerStyle={styles.votingScrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
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
                  color={day.accent}
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
              <Text style={styles.endVotingPillText}>
                {selectedPlayer
                  ? "Encerrar votação"
                  : "Pular votação (ninguém sai)"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.votingSection}>
            <View style={styles.groupChoicePill}>
              <Ionicons name="people-outline" size={14} color={day.accent} />
              <Text style={styles.groupChoicePillText}>
                Decisão coletiva do grupo
              </Text>
            </View>

            <Text style={styles.questionHeading}>
              Quem a cidade vai eliminar?
            </Text>
            <Text style={styles.questionSubtitle}>
              Debatam em roda e registrem aqui o jogador que o grupo decidiu
              eliminar para revelar seu papel.
            </Text>

            <View style={styles.voteGrid}>
              {alivePlayers.map(({ player }) => {
                const isSelected = selectedPlayerId === player.id;
                return (
                  <Pressable
                    key={player.id}
                    onPress={() => {
                      triggerSelection();
                      setSelectedPlayerId((prev) =>
                        prev === player.id ? null : player.id,
                      );
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Selecionar ${player.name} na escolha do grupo`}
                    style={({ pressed }) => [
                      styles.voteCard,
                      isSelected && styles.voteCardSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.voteCardTop}>
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
                            color={theme.isDark ? day.background : colors.white}
                          />
                        ) : null}
                      </View>
                    </View>

                    <Text style={styles.votePlayerName} numberOfLines={1}>
                      {player.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Text
          style={[
            styles.voteStatusText,
            selectedPlayer && styles.voteStatusSelected,
          ]}
          numberOfLines={1}
        >
          {selectedPlayer
            ? `Escolha do grupo: ${selectedPlayer.name}`
            : "Nenhum jogador escolhido pelo grupo"}
        </Text>

        <Button
          label="Confirmar Escolha do Grupo"
          onPress={() => setVoteConfirmVisible(true)}
          disabled={!selectedPlayer}
          style={styles.dayPrimaryButton}
          icon={<Ionicons name="checkmark" size={20} color={colors.white} />}
        />
      </View>

      <ConfirmModal
        visible={voteConfirmVisible}
        title="Confirmar eliminação?"
        message={
          selectedPlayer
            ? `O grupo decidiu eliminar ${selectedPlayer.name}? Seu papel será revelado para todos.`
            : "Selecione um jogador."
        }
        confirmLabel="Eliminar jogador"
        cancelLabel="Voltar"
        confirmVariant="danger"
        iconName="person-remove-outline"
        onConfirm={() => finishOnce(selectedPlayerId)}
        onCancel={() => setVoteConfirmVisible(false)}
      />

      <ConfirmModal
        visible={endConfirmVisible}
        title={selectedPlayer ? "Encerrar votação?" : "Pular votação?"}
        message={
          selectedPlayer
            ? `Deseja encerrar a votação e eliminar a escolha do grupo (${selectedPlayer.name})?`
            : "Nenhum jogador foi escolhido pelo grupo. Se encerrar agora, ninguém será eliminado hoje e a cidade voltará a dormir."
        }
        confirmLabel={selectedPlayer ? "Eliminar e encerrar" : "Ninguém sai"}
        cancelLabel="Voltar à votação"
        confirmVariant={selectedPlayer ? "primary" : "danger"}
        iconName={selectedPlayer ? "checkmark-circle-outline" : "moon-outline"}
        onConfirm={() => finishOnce(selectedPlayerId)}
        onCancel={() => setEndConfirmVisible(false)}
      />
    </View>
  );
}

function DayEliminationView({
  match,
  onProceedToNextNight,
  onViewGameOver,
  onRequestExit,
}: {
  match: CidadeDormeMatchState;
  onProceedToNextNight: () => void;
  onViewGameOver: () => void;
  onRequestExit: () => void;
}) {
  const { triggerWarning, triggerLightImpact } = useHaptics();
  const theme = useTheme();
  const { colors, cidadeDorme } = theme;
  const styles = useThemedStyles(createStyles);

  const eliminated = match.lastEliminatedDayPlayer;
  const aliveCount = match.players.filter((entry) => entry.alive).length;
  const roleMeta = eliminated ? CIDADE_DORME_ROLE_META[eliminated.role] : null;
  const roleVisuals = eliminated
    ? getCidadeDormeRoleVisuals(eliminated.role, theme)
    : null;

  useEffect(() => {
    if (eliminated) {
      triggerWarning();
    } else {
      triggerLightImpact();
    }
  }, [eliminated, triggerWarning, triggerLightImpact]);

  return (
    <View style={styles.container}>
      <DayHeader
        eyebrow={`DIA ${match.roundNumber}`}
        title="Decisão da Cidade"
        onRequestExit={onRequestExit}
      />

      <View style={styles.eliminationCenter}>
        {eliminated && roleMeta && roleVisuals ? (
          <View
            style={[
              styles.eliminationCard,
              { borderColor: roleVisuals.borderColor },
            ]}
          >
            <Text style={styles.eliminationEyebrow}>JOGADOR ELIMINADO</Text>

            <PlayerAvatar
              name={eliminated.player.name}
              color={eliminated.player.color}
              size={64}
            />

            <Text style={styles.eliminationName}>{eliminated.player.name}</Text>
            <Text style={styles.eliminationSubtitle}>
              foi eliminado(a) e saiu do jogo. Seu papel era:
            </Text>

            <View
              style={[
                styles.revealedRoleBox,
                {
                  backgroundColor: roleVisuals.softBgColor,
                  borderColor: roleVisuals.borderColor,
                },
              ]}
            >
              <RoleBadgeIcon
                role={eliminated.role}
                size={26}
                color={roleVisuals.accentColor}
              />
              <Text
                style={[
                  styles.revealedRoleText,
                  { color: roleVisuals.accentColor },
                ]}
              >
                {roleMeta.title.toUpperCase()}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.eliminationCard}>
            <View style={styles.noEliminationIcon} accessible={false}>
              <Ionicons
                name="scale-outline"
                size={38}
                color={cidadeDorme.day.accent}
              />
            </View>
            <Text style={styles.eliminationEyebrow}>VOTAÇÃO ENCERRADA</Text>
            <Text style={styles.eliminationName}>Ninguém foi eliminado</Text>
            <Text style={styles.eliminationSubtitle}>
              O grupo não escolheu nenhum suspeito hoje. Todos os jogadores
              vivos seguem na partida.
            </Text>
          </View>
        )}

        <View style={styles.statusSummaryPill}>
          <Text style={styles.statusSummaryText}>
            {match.winner === "citizens"
              ? "Todos os assassinos foram eliminados!"
              : match.winner === "assassins"
                ? "Os assassinos igualaram o número de inocentes!"
                : `${aliveCount} jogadores seguem vivos para a Noite ${match.roundNumber + 1}.`}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {match.winner ? (
          <Button
            label="Ver resultado final"
            onPress={onViewGameOver}
            style={styles.dayPrimaryButton}
            icon={
              <Ionicons name="trophy-outline" size={20} color={colors.white} />
            }
          />
        ) : (
          <Button
            label={`Anoitecer (Noite ${match.roundNumber + 1})`}
            onPress={onProceedToNextNight}
            style={styles.dayToNightButton}
            icon={
              <Ionicons name="moon-outline" size={20} color={colors.white} />
            }
          />
        )}
      </View>
    </View>
  );
}

const createStyles = ({ colors, cidadeDorme, shadowOpacity }: AppTheme) => {
  const day = cidadeDorme.day;

  return StyleSheet.create({
    animatedFill: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: SPACING.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.sm,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    dayPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: day.accentSoft,
      borderWidth: 1,
      borderColor: day.accentBorder,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 6,
    },
    dayPillText: {
      color: day.accent,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
    },
    headerTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
    },
    exitButton: {
      width: 38,
      height: 38,
      borderRadius: RADIUS.md,
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.border,
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.xxl,
      gap: SPACING.lg,
    },
    votingScrollContent: {
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.xxl,
      gap: SPACING.xxl,
    },
    dawnCard: {
      backgroundColor: day.surface,
      borderWidth: 1.5,
      borderRadius: RADIUS.xl,
      padding: SPACING.xxl,
      alignItems: "center",
      gap: SPACING.sm,
    },
    dawnCardDanger: {
      borderColor: colors.dangerBorder,
    },
    dawnCardSaved: {
      borderColor: colors.successBorder,
    },
    dawnCardNeutral: {
      borderColor: day.accentBorder,
    },
    dawnIconCircle: {
      width: 76,
      height: 76,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.xs,
    },
    dawnEyebrow: {
      color: day.accent,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.3,
    },
    dawnTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center",
    },
    dawnDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },
    boldText: {
      color: colors.textPrimary,
      fontWeight: "700",
    },
    victimChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      marginTop: SPACING.xs,
    },
    victimName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    victimStatus: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: "600",
    },
    endgameBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },
    endgameBannerText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 19,
    },
    debateCard: {
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      gap: SPACING.xs,
    },
    debateHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
    },
    debateTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    debateText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    section: {
      gap: SPACING.sm,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    sectionTitleMuted: {
      color: colors.textSecondary,
      fontSize: 14,
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
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.border,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      maxWidth: "48%",
    },
    playerChipName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
      flexShrink: 1,
    },
    eliminatedChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.borderSubtle,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      opacity: 0.65,
      maxWidth: "48%",
    },
    eliminatedInfo: {
      flexShrink: 1,
    },
    eliminatedChipName: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textDecorationLine: "line-through",
    },
    eliminatedChipSub: {
      color: colors.textMuted,
      fontSize: 11,
    },
    stickyTimerBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: day.surfaceElevated,
      borderWidth: 1,
      borderColor: day.border,
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
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.border,
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
      backgroundColor: day.border,
    },
    stickyProgressFill: {
      height: "100%",
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
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.border,
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
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.border,
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
      backgroundColor: day.accentSoft,
      borderWidth: 1,
      borderColor: day.accentBorder,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: 5,
      marginBottom: 2,
    },
    groupChoicePillText: {
      color: day.accent,
      fontSize: 12,
      fontWeight: "700",
    },
    questionHeading: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    questionSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: SPACING.sm,
    },
    voteGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: SPACING.md,
    },
    voteCard: {
      width: "48%",
      backgroundColor: day.surface,
      borderWidth: 1.5,
      borderColor: day.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      gap: SPACING.md,
    },
    voteCardSelected: {
      borderColor: day.accent,
      backgroundColor: day.accentSoft,
    },
    voteCardTop: {
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
    radioCircleSelected: {
      backgroundColor: day.accent,
      borderColor: day.accent,
    },
    votePlayerName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    voteStatusText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    voteStatusSelected: {
      color: day.accent,
    },
    eliminationCenter: {
      flex: 1,
      justifyContent: "center",
      gap: SPACING.lg,
      paddingBottom: SPACING.lg,
    },
    eliminationCard: {
      backgroundColor: day.surface,
      borderWidth: 1.5,
      borderColor: day.border,
      borderRadius: RADIUS.xl,
      padding: SPACING.xxl,
      alignItems: "center",
      gap: SPACING.md,
    },
    noEliminationIcon: {
      width: 72,
      height: 72,
      borderRadius: RADIUS.full,
      backgroundColor: day.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    eliminationEyebrow: {
      color: day.accent,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.3,
    },
    eliminationName: {
      color: colors.textPrimary,
      fontSize: 28,
      fontWeight: "900",
      textAlign: "center",
    },
    eliminationSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 270,
    },
    revealedRoleBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      borderWidth: 1,
      borderRadius: RADIUS.full,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      marginTop: SPACING.xs,
    },
    revealedRoleText: {
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0.8,
    },
    statusSummaryPill: {
      backgroundColor: day.surface,
      borderWidth: 1,
      borderColor: day.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      alignItems: "center",
    },
    statusSummaryText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    footer: {
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: day.borderSubtle,
      gap: SPACING.md,
    },
    dayPrimaryButton: {
      backgroundColor: day.primaryButton,
    },
    dayToNightButton: {
      backgroundColor: day.transitionToNightButton ?? day.primaryButton,
    },
  });
};
