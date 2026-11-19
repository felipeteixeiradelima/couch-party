import { CidadeDormeSettingsModal } from "@/components/games/CidadeDormeSettingsModal";
import { GameLobbyTemplate } from "@/components/games/GameLobbyTemplate";
import { CidadeDormeDayPhase } from "@/components/games/cidade-dorme/CidadeDormeDayPhase";
import {
  CidadeDormeNightPhase,
  NightCompletionPayload,
} from "@/components/games/cidade-dorme/CidadeDormeNightPhase";
import { CidadeDormeResultPhase } from "@/components/games/cidade-dorme/CidadeDormeResultPhase";
import { CidadeDormeRoleRevealPhase } from "@/components/games/cidade-dorme/CidadeDormeRoleRevealPhase";
import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { parsePlayerDbId, recordMatch } from "@/database";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useHaptics } from "@/hooks/useHaptics";
import { usePlayers } from "@/hooks/usePlayers";
import { useTheme } from "@/hooks/useTheme";
import {
  CidadeDormeMatchState,
  CidadeDormePhase,
  CidadeDormeSettings,
} from "@/types/cidadeDorme";
import {
  createCidadeDormeMatch,
  getCitizenCount,
  getDefaultCidadeDormeSettings,
  normalizeCidadeDormeSettings,
  resolveDayVote,
  resolveNightActions,
} from "@/utils/cidadeDormeEngine";
import { formatDurationLabel } from "@/utils/gameEngine";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, BackHandler, Easing, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

function getThemeColorStep(phase: CidadeDormePhase): number {
  if (phase === "night-intro" || phase === "night-pass") {
    return 1;
  }
  if (
    phase === "day-discussion" ||
    phase === "day-voting" ||
    phase === "day-elimination"
  ) {
    return 2;
  }
  return 0;
}

export function CidadeDormeFlow() {
  const db = useSQLiteContext();
  const { players, refreshPlayers } = usePlayers();
  const { animationsEnabled } = useAppSettings();
  const theme = useTheme();
  const {
    triggerDayTransition,
    triggerNightTransition,
    triggerSuccess,
    triggerWarning,
    cancelVibration,
  } = useHaptics();

  const [phase, setPhase] = useState<CidadeDormePhase>("lobby");
  const [settings, setSettings] = useState<CidadeDormeSettings>(() =>
    getDefaultCidadeDormeSettings(players.length),
  );
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);

  const [matchCounter, setMatchCounter] = useState(0);
  const [match, setMatch] = useState<CidadeDormeMatchState | null>(null);

  const prevPhaseRef = useRef<CidadeDormePhase>(phase);
  const recordedMatchIdRef = useRef<number | null>(null);
  const [themeAnim] = useState(() => new Animated.Value(0));

  const persistFinishedMatch = useCallback(
    (finishedMatch: CidadeDormeMatchState) => {
      if (!finishedMatch.winner) return;
      if (recordedMatchIdRef.current === finishedMatch.matchId) return;
      recordedMatchIdRef.current = finishedMatch.matchId;

      const winner = finishedMatch.winner;
      void recordMatch(db, {
        gameType: "cidade-dorme",
        winnerSide: winner,
        outcomeDetail: winner,
        gameItemId: null,
        roundsCount: finishedMatch.roundNumber,
        participants: finishedMatch.players.map((entry) => {
          const isAssassin = entry.role === "assassin";
          const won =
            (winner === "assassins" && isAssassin) ||
            (winner === "citizens" && !isAssassin);

          return {
            playerId: parsePlayerDbId(entry.player.id),
            playerName: entry.player.name,
            avatarColor: entry.player.color,
            role: entry.role,
            alignment: isAssassin ? "impostor" : "innocent",
            won,
            survived: entry.alive,
          };
        }),
      })
        .then(() => refreshPlayers())
        .catch(() => {
          // Do not block end-of-match UI if match logging fails.
        });
    },
    [db, refreshPlayers],
  );

  const effectiveSettings = useMemo(
    () => normalizeCidadeDormeSettings(settings, players.length),
    [settings, players.length],
  );

  // Trigger day/night device vibrations and endgame haptics on phase transitions.
  useEffect(() => {
    const previousPhase = prevPhaseRef.current;
    if (previousPhase === phase) {
      return;
    }
    prevPhaseRef.current = phase;

    if (phase === "night-intro") {
      triggerNightTransition();
    } else if (phase === "day-discussion") {
      triggerDayTransition();
    } else if (phase === "game-over" && match?.winner) {
      if (match.winner === "citizens") {
        triggerSuccess();
      } else {
        triggerWarning();
      }
    } else if (phase === "lobby") {
      cancelVibration();
    }
  }, [
    phase,
    match?.winner,
    triggerNightTransition,
    triggerDayTransition,
    triggerSuccess,
    triggerWarning,
    cancelVibration,
  ]);

  // Ensure any running vibration stops if the screen unmounts mid-transition.
  useEffect(() => {
    return () => {
      cancelVibration();
    };
  }, [cancelVibration]);

  // Smoothly animate background color between neutral, night, and day palettes.
  useEffect(() => {
    const targetStep = getThemeColorStep(phase);
    if (!animationsEnabled) {
      themeAnim.setValue(targetStep);
      return;
    }

    const anim = Animated.timing(themeAnim, {
      toValue: targetStep,
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();

    return () => {
      anim.stop();
    };
  }, [animationsEnabled, phase, themeAnim]);

  const startNewMatch = useCallback(() => {
    const nextMatchId = matchCounter + 1;
    const createdMatch = createCidadeDormeMatch(
      players,
      effectiveSettings,
      nextMatchId,
    );

    setMatchCounter(nextMatchId);
    setMatch(createdMatch);
    setPhase("role-reveal");
  }, [matchCounter, players, effectiveSettings]);

  const handleCompleteNight = useCallback(
    (payload: NightCompletionPayload) => {
      if (!match) return;
      const updated = resolveNightActions({
        match,
        assassinVotes: payload.assassinVotes,
        guardianTargetIds: payload.guardianTargetIds,
        detectiveInvestigatedIds: payload.detectiveInvestigatedIds,
      });
      setMatch(updated);
      persistFinishedMatch(updated);
      setPhase("day-discussion");
    },
    [match, persistFinishedMatch],
  );

  const handleFinishVoting = useCallback(
    (votedPlayerId: string | null) => {
      if (!match) return;
      const updated = resolveDayVote({ match, votedPlayerId });
      setMatch(updated);
      persistFinishedMatch(updated);
      setPhase("day-elimination");
    },
    [match, persistFinishedMatch],
  );

  const handleProceedToNextNight = useCallback(() => {
    setMatch((prev) =>
      prev
        ? {
            ...prev,
            roundNumber: prev.roundNumber + 1,
          }
        : null,
    );
    setPhase("night-intro");
  }, []);

  const handleReturnToLobby = useCallback(() => {
    setExitConfirmVisible(false);
    setMatch(null);
    setPhase("lobby");
  }, []);

  const handleBackToMenu = useCallback(() => {
    setExitConfirmVisible(false);
    setMatch(null);
    router.dismissTo("/");
  }, []);

  useEffect(() => {
    if (phase === "lobby") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (phase === "game-over") {
          handleReturnToLobby();
          return true;
        }
        setExitConfirmVisible(true);
        return true;
      },
    );

    return () => subscription.remove();
  }, [phase, handleReturnToLobby]);

  if (phase === "lobby" || !match) {
    const citizenCount = getCitizenCount(effectiveSettings, players.length);
    return (
      <>
        <GameLobbyTemplate
          gameId="cidade-dorme"
          lobbyConfig={{
            settingRows: [
              {
                label: "Assassinos",
                value: String(effectiveSettings.assassinCount),
              },
              {
                label: "Detetives",
                value:
                  effectiveSettings.detectiveCount === 0
                    ? "0 (Desativado)"
                    : String(effectiveSettings.detectiveCount),
              },
              {
                label: "Anjos da Guarda",
                value:
                  effectiveSettings.guardianAngelCount === 0
                    ? "0 (Desativado)"
                    : String(effectiveSettings.guardianAngelCount),
              },
              {
                label: "Cidadãos",
                value: String(citizenCount),
              },
              {
                label: "Tempo de votação",
                value: effectiveSettings.votingTimerEnabled
                  ? formatDurationLabel(effectiveSettings.votingDurationSeconds)
                  : "Desativado",
              },
            ],
            onOpenSettings: () => setSettingsModalVisible(true),
            onStartGame: startNewMatch,
          }}
        />

        <CidadeDormeSettingsModal
          visible={settingsModalVisible}
          settings={effectiveSettings}
          playerCount={players.length}
          onSave={(nextSettings) => {
            setSettings(nextSettings);
            setSettingsModalVisible(false);
          }}
          onClose={() => setSettingsModalVisible(false)}
        />
      </>
    );
  }

  const isNightPhase = phase === "night-intro" || phase === "night-pass";
  const animatedBackgroundColor = themeAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      theme.colors.background,
      theme.cidadeDorme.night.background,
      theme.cidadeDorme.day.background,
    ],
  });

  return (
    <AnimatedSafeAreaView
      style={[styles.safeArea, { backgroundColor: animatedBackgroundColor }]}
      edges={["top", "bottom"]}
    >
      {phase === "role-reveal" ? (
        <AnimatedPhaseView
          key={`phase-reveal-${match.matchId}`}
          style={styles.phaseFill}
          variant="fade-up"
        >
          <CidadeDormeRoleRevealPhase
            key={`reveal-${match.matchId}`}
            match={match}
            onCompleteReveal={() => setPhase("night-intro")}
            onRequestExit={() => setExitConfirmVisible(true)}
          />
        </AnimatedPhaseView>
      ) : null}

      {isNightPhase ? (
        <AnimatedPhaseView
          key={`phase-night-${match.matchId}-${match.roundNumber}`}
          style={styles.phaseFill}
          variant="fade-up"
          duration={300}
        >
          <CidadeDormeNightPhase
            key={`night-${match.matchId}-${match.roundNumber}`}
            match={match}
            startAtPass={phase === "night-pass"}
            onBeginNightPass={() => setPhase("night-pass")}
            onCompleteNight={handleCompleteNight}
            onRequestExit={() => setExitConfirmVisible(true)}
          />
        </AnimatedPhaseView>
      ) : null}

      {phase === "day-discussion" ||
      phase === "day-voting" ||
      phase === "day-elimination" ? (
        <AnimatedPhaseView
          key={`phase-day-${match.matchId}-${match.roundNumber}`}
          style={styles.phaseFill}
          variant="fade-up"
          duration={300}
        >
          <CidadeDormeDayPhase
            key={`day-${match.matchId}-${match.roundNumber}`}
            phase={phase}
            match={match}
            onAdvanceToVoting={() => setPhase("day-voting")}
            onFinishVoting={handleFinishVoting}
            onProceedToNextNight={handleProceedToNextNight}
            onViewGameOver={() => setPhase("game-over")}
            onRequestExit={() => setExitConfirmVisible(true)}
          />
        </AnimatedPhaseView>
      ) : null}

      {phase === "game-over" ? (
        <AnimatedPhaseView
          key={`phase-result-${match.matchId}`}
          style={styles.phaseFill}
          variant="pop"
        >
          <CidadeDormeResultPhase
            key={`result-${match.matchId}`}
            match={match}
            onPlayAgain={startNewMatch}
            onBackToLobby={handleReturnToLobby}
            onBackToMenu={handleBackToMenu}
          />
        </AnimatedPhaseView>
      ) : null}

      <ConfirmModal
        visible={exitConfirmVisible}
        title="Encerrar partida?"
        message="Se sair agora, o progresso desta partida de Cidade Dorme será perdido."
        confirmLabel="Sair da partida"
        cancelLabel="Continuar jogando"
        confirmVariant="danger"
        iconName="exit-outline"
        onConfirm={handleReturnToLobby}
        onCancel={() => setExitConfirmVisible(false)}
      />
    </AnimatedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  phaseFill: {
    flex: 1,
  },
});
