import { GameLobbyTemplate } from "@/components/games/GameLobbyTemplate";
import { GameSettingsModal } from "@/components/games/GameSettingsModal";
import { DiscussionWaitingPhase } from "@/components/games/phases/DiscussionWaitingPhase";
import { ResultPhase } from "@/components/games/phases/ResultPhase";
import { SecretRolePhase } from "@/components/games/phases/SecretRolePhase";
import { VotingPhase } from "@/components/games/phases/VotingPhase";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { COLORS } from "@/constants/theme";
import { getGameCategories } from "@/data/gameContent";
import { usePlayers } from "@/hooks/usePlayers";
import {
  ActiveRoundState,
  GamePhase,
  GameSettings,
  RoundResult,
  SupportedPartyGameId,
} from "@/types/game";
import {
  clampImpostorCount,
  createRound,
  getDefaultGameSettings,
  resolveRoundResult,
  UsedHintHistory,
} from "@/utils/gameEngine";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PartyGameFlowProps {
  gameId: SupportedPartyGameId;
}

export function PartyGameFlow({ gameId }: PartyGameFlowProps) {
  const { players } = usePlayers();
  const categories = useMemo(() => getGameCategories(gameId), [gameId]);

  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [settings, setSettings] = useState<GameSettings>(() =>
    getDefaultGameSettings(players.length),
  );
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);

  const [roundNumber, setRoundNumber] = useState(0);
  const [activeRound, setActiveRound] = useState<ActiveRoundState | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [usedHintHistory, setUsedHintHistory] = useState<UsedHintHistory>({});

  const effectiveSettings = useMemo(() => {
    const clamped = clampImpostorCount(settings.impostorCount, players.length);
    return clamped === settings.impostorCount
      ? settings
      : { ...settings, impostorCount: clamped };
  }, [settings, players.length]);

  const startNewRound = useCallback(() => {
    const nextRoundNumber = roundNumber + 1;
    const { round, nextHintHistory } = createRound({
      gameId,
      players,
      settings: effectiveSettings,
      usedHintHistory,
      roundNumber: nextRoundNumber,
    });

    setRoundNumber(nextRoundNumber);
    setUsedHintHistory(nextHintHistory);
    setActiveRound(round);
    setRoundResult(null);
    setPhase("reveal");
  }, [gameId, players, effectiveSettings, usedHintHistory, roundNumber]);

  const handleFinishVoting = useCallback(
    (votedPlayerIds: readonly string[]) => {
      if (!activeRound) return;
      const result = resolveRoundResult(activeRound, votedPlayerIds);
      setRoundResult(result);
      setPhase("result");
    },
    [activeRound],
  );

  const handleReturnToLobby = useCallback(() => {
    setExitConfirmVisible(false);
    setActiveRound(null);
    setRoundResult(null);
    setPhase("lobby");
  }, []);

  // Intercept Android hardware back during active match phases.
  useEffect(() => {
    if (phase === "lobby") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (phase === "result") {
          handleReturnToLobby();
          return true;
        }
        setExitConfirmVisible(true);
        return true;
      },
    );

    return () => subscription.remove();
  }, [phase, handleReturnToLobby]);

  if (phase === "lobby" || !activeRound) {
    return (
      <>
        <GameLobbyTemplate
          gameId={gameId}
          lobbyConfig={{
            settings: effectiveSettings,
            categories,
            onOpenSettings: () => setSettingsModalVisible(true),
            onStartGame: startNewRound,
          }}
        />

        <GameSettingsModal
          visible={settingsModalVisible}
          settings={effectiveSettings}
          categories={categories}
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {phase === "reveal" ? (
        <SecretRolePhase
          key={activeRound.roundNumber}
          round={activeRound}
          onCompleteReveal={() => setPhase("discussion")}
          onRequestExit={() => setExitConfirmVisible(true)}
        />
      ) : null}

      {phase === "discussion" ? (
        <DiscussionWaitingPhase
          key={activeRound.roundNumber}
          round={activeRound}
          onAdvanceToVoting={() => setPhase("voting")}
          onRequestExit={() => setExitConfirmVisible(true)}
        />
      ) : null}

      {phase === "voting" ? (
        <VotingPhase
          key={activeRound.roundNumber}
          round={activeRound}
          onFinishVoting={handleFinishVoting}
          onRequestExit={() => setExitConfirmVisible(true)}
        />
      ) : null}

      {phase === "result" && roundResult ? (
        <ResultPhase
          key={activeRound.roundNumber}
          round={activeRound}
          result={roundResult}
          onPlayAgain={startNewRound}
          onBackToLobby={handleReturnToLobby}
        />
      ) : null}

      <ConfirmModal
        visible={exitConfirmVisible}
        title="Encerrar partida?"
        message="Se sair agora, o progresso da rodada atual será perdido."
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
    backgroundColor: COLORS.background,
  },
});
