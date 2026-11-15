import { GAMES_BY_ID } from "@/constants/games";
import { getMockGameData } from "@/data/gameContent";
import {
  ActiveRoundState,
  GameSettings,
  PlayerAssignment,
  RoundPrompt,
  RoundResult,
  SupportedPartyGameId,
} from "@/types/game";
import { Player } from "@/types/player";

export const MIN_VOTING_SECONDS = 30;
export const MAX_VOTING_SECONDS = 600;
export const DEFAULT_VOTING_SECONDS = 180;
export const VOTING_STEP_SECONDS = 30;

export const VOTING_PRESET_SECONDS = [30, 60, 120, 180, 300, 600] as const;

export type UsedHintHistory = Record<string, string[]>;

export function getMaxImpostors(playerCount: number): number {
  return Math.max(1, playerCount - 1);
}

export function clampImpostorCount(count: number, playerCount: number): number {
  const maxImpostors = getMaxImpostors(playerCount);
  return Math.min(Math.max(1, Math.round(count)), maxImpostors);
}

export function clampVotingSeconds(seconds: number): number {
  return Math.min(
    Math.max(MIN_VOTING_SECONDS, Math.round(seconds)),
    MAX_VOTING_SECONDS,
  );
}

export function getDefaultGameSettings(playerCount: number): GameSettings {
  return {
    impostorCount: clampImpostorCount(1, playerCount),
    selectedCategoryIds: [],
    hintEnabled: true,
    votingTimerEnabled: true,
    votingDurationSeconds: DEFAULT_VOTING_SECONDS,
  };
}

/**
 * Formats seconds as MM:SS for countdown displays.
 */
export function formatTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Formats duration in seconds as a concise Portuguese label (e.g. "30s", "1min 30s", "3min").
 */
export function formatDurationLabel(totalSeconds: number): string {
  const clamped = clampVotingSeconds(totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}min`;
  }

  return `${minutes}min ${seconds}s`;
}

export function pickRandomElement<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick a random element from an empty list.");
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Selects a hint for the item while avoiding previously used hints until all are exhausted.
 */
function selectNonRepeatingHint(
  itemId: string,
  hints: readonly string[],
  usedHintHistory: UsedHintHistory,
): { hint: string | null; nextHistory: UsedHintHistory } {
  if (hints.length === 0) {
    return { hint: null, nextHistory: usedHintHistory };
  }

  const usedForItem = usedHintHistory[itemId] ?? [];
  const unusedHints = hints.filter((hint) => !usedForItem.includes(hint));

  let chosenHint: string;
  let updatedUsedList: string[];

  if (unusedHints.length > 0) {
    chosenHint = pickRandomElement(unusedHints);
    updatedUsedList = [...usedForItem, chosenHint];
  } else {
    const lastUsedHint = usedForItem[usedForItem.length - 1];
    const fallbackPool =
      hints.length > 1 ? hints.filter((hint) => hint !== lastUsedHint) : hints;
    chosenHint = pickRandomElement(fallbackPool);
    updatedUsedList = [chosenHint];
  }

  return {
    hint: chosenHint,
    nextHistory: {
      ...usedHintHistory,
      [itemId]: updatedUsedList,
    },
  };
}

function selectCategoryPool<
  T extends { id: string; items: readonly unknown[] },
>(categories: readonly T[], selectedCategoryIds: readonly string[]): T[] {
  const nonEmptyCategories = categories.filter((c) => c.items.length > 0);
  if (selectedCategoryIds.length === 0) {
    return nonEmptyCategories;
  }

  const filtered = nonEmptyCategories.filter((category) =>
    selectedCategoryIds.includes(category.id),
  );
  return filtered.length > 0 ? filtered : nonEmptyCategories;
}

interface CreateRoundParams {
  gameId: SupportedPartyGameId;
  players: readonly Player[];
  settings: GameSettings;
  usedHintHistory: UsedHintHistory;
  roundNumber: number;
}

export function createRound({
  gameId,
  players,
  settings,
  usedHintHistory,
  roundNumber,
}: CreateRoundParams): {
  round: ActiveRoundState;
  nextHintHistory: UsedHintHistory;
} {
  const metadata = GAMES_BY_ID[gameId];
  if (
    players.length < metadata.minPlayers ||
    players.length > metadata.maxPlayers
  ) {
    throw new Error(
      `${metadata.title} requer entre ${metadata.minPlayers} e ${metadata.maxPlayers} jogadores.`,
    );
  }

  const normalizedSettings: GameSettings = {
    ...settings,
    impostorCount: clampImpostorCount(settings.impostorCount, players.length),
    votingDurationSeconds: clampVotingSeconds(settings.votingDurationSeconds),
  };

  const data = getMockGameData();
  let prompt: RoundPrompt;
  let nextHintHistory = usedHintHistory;

  if (gameId === "impostor") {
    const pool = selectCategoryPool(
      data.impostor.categories,
      normalizedSettings.selectedCategoryIds,
    );
    const chosenCategory = pickRandomElement(pool);
    const chosenItem = pickRandomElement(chosenCategory.items);

    let impostorHint: string | null = null;
    if (normalizedSettings.hintEnabled) {
      const hintSelection = selectNonRepeatingHint(
        chosenItem.id,
        chosenItem.hints,
        usedHintHistory,
      );
      impostorHint = hintSelection.hint;
      nextHintHistory = hintSelection.nextHistory;
    }

    prompt = {
      gameId: "impostor",
      categoryId: chosenCategory.id,
      categoryName: chosenCategory.name,
      itemId: chosenItem.id,
      secretWord: chosenItem.word,
      impostorHint,
    };
  } else {
    const pool = selectCategoryPool(
      data.perguntas.categories,
      normalizedSettings.selectedCategoryIds,
    );
    const chosenCategory = pickRandomElement(pool);
    const chosenItem = pickRandomElement(chosenCategory.items);

    let impostorHint: string | null = null;
    if (normalizedSettings.hintEnabled) {
      const hintSelection = selectNonRepeatingHint(
        chosenItem.id,
        chosenItem.hints,
        usedHintHistory,
      );
      impostorHint = hintSelection.hint;
      nextHintHistory = hintSelection.nextHistory;
    }

    prompt = {
      gameId: "perguntas",
      categoryId: chosenCategory.id,
      categoryName: chosenCategory.name,
      itemId: chosenItem.id,
      innocentQuestion: chosenItem.innocentQuestion,
      impostorQuestion: chosenItem.impostorQuestion,
      impostorHint,
    };
  }

  const shuffledPlayers = shuffleArray(players);
  const impostorIds = new Set(
    shuffledPlayers
      .slice(0, normalizedSettings.impostorCount)
      .map((player) => player.id),
  );

  const assignments: PlayerAssignment[] = players.map((player) => ({
    player,
    role: impostorIds.has(player.id) ? "impostor" : "innocent",
  }));

  return {
    round: {
      roundNumber,
      assignments,
      prompt,
      settingsSnapshot: normalizedSettings,
    },
    nextHintHistory,
  };
}

/**
 * Formats a list of player names in natural Portuguese (e.g. "Ana, Bruno e Carla").
 */
export function formatPlayerNames(players: readonly Player[]): string {
  if (players.length === 0) return "";
  if (players.length === 1) return players[0].name;
  if (players.length === 2) return `${players[0].name} e ${players[1].name}`;

  const head = players
    .slice(0, -1)
    .map((player) => player.name)
    .join(", ");
  return `${head} e ${players[players.length - 1].name}`;
}

/**
 * Resolves the match outcome from the group's votes (or walkover when no player was selected).
 */
export function resolveRoundResult(
  round: ActiveRoundState,
  votedPlayerIds: readonly string[],
): RoundResult {
  const impostors = round.assignments
    .filter((assignment) => assignment.role === "impostor")
    .map((assignment) => assignment.player);

  const uniqueVoteIds = Array.from(new Set(votedPlayerIds));
  const votedAssignments = uniqueVoteIds
    .map((id) =>
      round.assignments.find((assignment) => assignment.player.id === id),
    )
    .filter((assignment): assignment is PlayerAssignment => assignment != null);

  if (votedAssignments.length === 0) {
    return {
      outcome: "impostors_wo",
      winningRole: "impostor",
      votedPlayers: [],
      impostors,
      isWalkover: true,
    };
  }

  const innocentsWon =
    votedAssignments.length === impostors.length &&
    votedAssignments.every((assignment) => assignment.role === "impostor");

  if (innocentsWon) {
    return {
      outcome: "innocents",
      winningRole: "innocent",
      votedPlayers: votedAssignments,
      impostors,
      isWalkover: false,
    };
  }

  return {
    outcome: "impostors_wrong_vote",
    winningRole: "impostor",
    votedPlayers: votedAssignments,
    impostors,
    isWalkover: false,
  };
}
