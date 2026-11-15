import { CidadeDormeSettingsModal } from "@/components/games/CidadeDormeSettingsModal";
import { GameLobbyTemplate } from "@/components/games/GameLobbyTemplate";
import { CidadeDormeDayPhase } from "@/components/games/cidade-dorme/CidadeDormeDayPhase";
import {
  CidadeDormeNightPhase,
  NightCompletionPayload,
} from "@/components/games/cidade-dorme/CidadeDormeNightPhase";
import { CidadeDormeResultPhase } from "@/components/games/cidade-dorme/CidadeDormeResultPhase";
import { CidadeDormeRoleRevealPhase } from "@/components/games/cidade-dorme/CidadeDormeRoleRevealPhase";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CIDADE_DORME_THEMES, COLORS } from "@/constants/theme";
import { usePlayers } from "@/hooks/usePlayers";
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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function CidadeDormeFlow() {
  const { players } = usePlayers();

  const [phase, setPhase] = useState<CidadeDormePhase>("lobby");
  const [settings, setSettings] = useState<CidadeDormeSettings>(() =>
    getDefaultCidadeDormeSettings(players.length),
  );
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);

  const [matchCounter, setMatchCounter] = useState(0);
  const [match, setMatch] = useState<CidadeDormeMatchState | null>(null);

  const effectiveSettings = useMemo(
    () => normalizeCidadeDormeSettings(settings, players.length),
    [settings, players.length],
  );

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
      setPhase("day-discussion");
    },
    [match],
  );

  const handleFinishVoting = useCallback(
    (votedPlayerId: string | null) => {
      if (!match) return;
      const updated = resolveDayVote({ match, votedPlayerId });
      setMatch(updated);
      setPhase("day-elimination");
    },
    [match],
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
  const isDayPhase =
    phase === "day-discussion" ||
    phase === "day-voting" ||
    phase === "day-elimination";

  const backgroundColor = isNightPhase
    ? CIDADE_DORME_THEMES.night.background
    : isDayPhase
      ? CIDADE_DORME_THEMES.day.background
      : COLORS.background;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={["top", "bottom"]}
    >
      {phase === "role-reveal" ? (
        <CidadeDormeRoleRevealPhase
          key={`reveal-${match.matchId}`}
          match={match}
          onCompleteReveal={() => setPhase("night-intro")}
          onRequestExit={() => setExitConfirmVisible(true)}
        />
      ) : null}

      {isNightPhase ? (
        <CidadeDormeNightPhase
          key={`night-${match.matchId}-${match.roundNumber}`}
          match={match}
          startAtPass={phase === "night-pass"}
          onBeginNightPass={() => setPhase("night-pass")}
          onCompleteNight={handleCompleteNight}
          onRequestExit={() => setExitConfirmVisible(true)}
        />
      ) : null}

      {phase === "day-discussion" ||
      phase === "day-voting" ||
      phase === "day-elimination" ? (
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
      ) : null}

      {phase === "game-over" ? (
        <CidadeDormeResultPhase
          key={`result-${match.matchId}`}
          match={match}
          onPlayAgain={startNewMatch}
          onBackToLobby={handleReturnToLobby}
        />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
