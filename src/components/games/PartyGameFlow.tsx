import { GameLobbyTemplate } from "@/components/games/GameLobbyTemplate";
import { GameSettingsModal } from "@/components/games/GameSettingsModal";
import { DiscussionWaitingPhase } from "@/components/games/phases/DiscussionWaitingPhase";
import { QuestionAnswerPhase } from "@/components/games/phases/QuestionAnswerPhase";
import { ResultPhase } from "@/components/games/phases/ResultPhase";
import { SecretRolePhase } from "@/components/games/phases/SecretRolePhase";
import { VotingPhase } from "@/components/games/phases/VotingPhase";
import { AnimatedPhaseView } from "@/components/ui/AnimatedPhaseView";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AppTheme } from "@/constants/theme";
import { getGameCategories } from "@/data/gameContent";
import {
  getCategoriesByGame,
  getPlayableImpostorCategories,
  getPlayableQuestionCategories,
  parsePlayerDbId,
  recordMatch,
} from "@/database";
import { useHaptics } from "@/hooks/useHaptics";
import { usePlayers } from "@/hooks/usePlayers";
import { useThemedStyles } from "@/hooks/useTheme";
import {
  ActiveRoundState,
  GameCategorySummary,
  GamePhase,
  GameSettings,
  ImpostorCategory,
  QuestionCategory,
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
import { useSQLiteContext } from "expo-sqlite";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackHandler, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PartyGameFlowProps {
  gameId: SupportedPartyGameId;
}

export function PartyGameFlow({ gameId }: PartyGameFlowProps) {
  const db = useSQLiteContext();
  const { players, refreshPlayers } = usePlayers();
  const { triggerSuccess, triggerWarning } = useHaptics();
  const styles = useThemedStyles(createStyles);

  const [categories, setCategories] = useState<GameCategorySummary[]>(() =>
    getGameCategories(gameId),
  );
  const [impostorCategories, setImpostorCategories] = useState<
    ImpostorCategory[]
  >([]);
  const [questionCategories, setQuestionCategories] = useState<
    QuestionCategory[]
  >([]);

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

  const prevPhaseRef = useRef<GamePhase>(phase);

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const dbCategories = await getCategoriesByGame(db, gameId);
        if (gameId === "impostor") {
          const playable = await getPlayableImpostorCategories(db);
          if (isMounted) {
            if (dbCategories.length > 0) setCategories(dbCategories);
            setImpostorCategories(playable);
          }
        } else {
          const playable = await getPlayableQuestionCategories(db);
          if (isMounted) {
            if (dbCategories.length > 0) setCategories(dbCategories);
            setQuestionCategories(playable);
          }
        }
      } catch {
        // Keep bundled fallback data if database query fails.
      }
    }

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [db, gameId]);

  const effectiveSettings = useMemo(() => {
    const clamped = clampImpostorCount(settings.impostorCount, players.length);
    return clamped === settings.impostorCount
      ? settings
      : { ...settings, impostorCount: clamped };
  }, [settings, players.length]);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    if (prevPhase === phase) {
      return;
    }
    prevPhaseRef.current = phase;

    if (phase === "result" && roundResult) {
      if (roundResult.winningRole === "innocent") {
        triggerSuccess();
      } else {
        triggerWarning();
      }
    }
  }, [phase, roundResult, triggerSuccess, triggerWarning]);

  const startNewRound = useCallback(() => {
    const nextRoundNumber = roundNumber + 1;
    const { round, nextHintHistory } = createRound({
      gameId,
      players,
      settings: effectiveSettings,
      usedHintHistory,
      roundNumber: nextRoundNumber,
      impostorCategories,
      questionCategories,
    });

    setRoundNumber(nextRoundNumber);
    setUsedHintHistory(nextHintHistory);
    setActiveRound(round);
    setRoundResult(null);
    setPhase("reveal");
  }, [
    gameId,
    players,
    effectiveSettings,
    usedHintHistory,
    roundNumber,
    impostorCategories,
    questionCategories,
  ]);

  const handleFinishVoting = useCallback(
    (votedPlayerIds: readonly string[]) => {
      if (!activeRound) return;
      const result = resolveRoundResult(activeRound, votedPlayerIds);
      setRoundResult(result);
      setPhase("result");

      void recordMatch(db, {
        gameType: gameId,
        winnerSide:
          result.winningRole === "innocent" ? "innocents" : "impostors",
        outcomeDetail: result.outcome,
        gameItemId: activeRound.prompt.itemDbId ?? null,
        roundsCount: activeRound.roundNumber,
        participants: activeRound.assignments.map((assignment) => ({
          playerId: parsePlayerDbId(assignment.player.id),
          playerName: assignment.player.name,
          avatarColor: assignment.player.color,
          role: assignment.role,
          alignment: assignment.role,
          won: assignment.role === result.winningRole,
        })),
      })
        .then(() => refreshPlayers())
        .catch(() => {
          // Do not block the round result UI if match logging fails.
        });
    },
    [activeRound, db, gameId, refreshPlayers],
  );

  const handleCompleteAnswers = useCallback(
    (answers: Record<string, string>) => {
      setActiveRound((prev) => (prev ? { ...prev, answers } : prev));
      setPhase("discussion");
    },
    [],
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
          showHintSetting={gameId === "impostor"}
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
        <AnimatedPhaseView
          key={`reveal-${activeRound.roundNumber}`}
          style={styles.phaseFill}
          variant="fade-up"
        >
          {activeRound.prompt.gameId === "impostor" ? (
            <SecretRolePhase
              round={activeRound}
              onCompleteReveal={() => setPhase("discussion")}
              onRequestExit={() => setExitConfirmVisible(true)}
            />
          ) : (
            <QuestionAnswerPhase
              round={activeRound}
              onCompleteAnswers={handleCompleteAnswers}
              onRequestExit={() => setExitConfirmVisible(true)}
            />
          )}
        </AnimatedPhaseView>
      ) : null}

      {phase === "discussion" ? (
        <AnimatedPhaseView
          key={`discussion-${activeRound.roundNumber}`}
          style={styles.phaseFill}
          variant="fade-up"
        >
          <DiscussionWaitingPhase
            round={activeRound}
            onAdvanceToVoting={() => setPhase("voting")}
            onRequestExit={() => setExitConfirmVisible(true)}
          />
        </AnimatedPhaseView>
      ) : null}

      {phase === "voting" ? (
        <AnimatedPhaseView
          key={`voting-${activeRound.roundNumber}`}
          style={styles.phaseFill}
          variant="fade-up"
        >
          <VotingPhase
            round={activeRound}
            onFinishVoting={handleFinishVoting}
            onRequestExit={() => setExitConfirmVisible(true)}
          />
        </AnimatedPhaseView>
      ) : null}

      {phase === "result" && roundResult ? (
        <AnimatedPhaseView
          key={`result-${activeRound.roundNumber}`}
          style={styles.phaseFill}
          variant="pop"
        >
          <ResultPhase
            round={activeRound}
            result={roundResult}
            onPlayAgain={startNewRound}
            onBackToLobby={handleReturnToLobby}
          />
        </AnimatedPhaseView>
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

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    phaseFill: {
      flex: 1,
    },
  });
