import { Player } from "./player";

export type GameId = "impostor" | "cidade-dorme" | "perguntas";

export type SupportedPartyGameId = "impostor" | "perguntas";

export type GameRoute =
  "/games/impostor" | "/games/cidade-dorme" | "/games/perguntas";

export interface GameMetadata {
  id: GameId;
  title: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  route: GameRoute;
  accentColor: string;
  iconBgColor: string;
  rulesSummary: string[];
}

export interface ImpostorWordItem {
  id: string;
  dbId?: number;
  word: string;
  hints: string[];
  isCustom?: boolean;
}

export interface ImpostorCategory {
  id: string;
  dbId?: number;
  name: string;
  isCustom?: boolean;
  items: ImpostorWordItem[];
}

export interface QuestionPairItem {
  id: string;
  dbId?: number;
  innocentQuestion: string;
  impostorQuestion: string;
  hints?: string[];
  isCustom?: boolean;
}

export interface QuestionCategory {
  id: string;
  dbId?: number;
  name: string;
  isCustom?: boolean;
  items: QuestionPairItem[];
}

export interface SeedCategoryRecord {
  slug: string;
  game_type: SupportedPartyGameId;
  name: string;
  is_custom: 0 | 1;
}

export interface SeedGameItemRecord {
  slug: string;
  game_type: SupportedPartyGameId;
  category_slug: string;
  main_content: string;
  impostor_content: string | null;
  hints: string[];
  is_custom: 0 | 1;
  is_active: 0 | 1;
}

export interface DatabaseSeedData {
  categories: SeedCategoryRecord[];
  game_items: SeedGameItemRecord[];
}

export interface GameData {
  impostor: {
    categories: ImpostorCategory[];
  };
  perguntas: {
    categories: QuestionCategory[];
  };
}

export interface GameCategorySummary {
  id: string;
  name: string;
  itemCount: number;
}

export interface GameSettings {
  impostorCount: number;
  /** Empty array means randomize across all available categories. */
  selectedCategoryIds: string[];
  hintEnabled: boolean;
  discussionTimerEnabled: boolean;
  discussionDurationSeconds: number;
  votingTimerEnabled: boolean;
  votingDurationSeconds: number;
}

export type PlayerRole = "innocent" | "impostor";

export interface PlayerAssignment {
  player: Player;
  role: PlayerRole;
}

export type RoundPrompt =
  | {
      gameId: "impostor";
      categoryId: string;
      categoryName: string;
      itemId: string;
      itemDbId?: number;
      secretWord: string;
      impostorHint: string | null;
    }
  | {
      gameId: "perguntas";
      categoryId: string;
      categoryName: string;
      itemId: string;
      itemDbId?: number;
      innocentQuestion: string;
      impostorQuestion: string;
    };

export interface ActiveRoundState {
  roundNumber: number;
  assignments: PlayerAssignment[];
  prompt: RoundPrompt;
  settingsSnapshot: GameSettings;
  /** Recorded answers keyed by player ID (used in Perguntas). */
  answers: Record<string, string>;
  /** Randomly selected starting player ID for Impostor discussion. */
  startingPlayerId: string | null;
}

export type GamePhase = "lobby" | "reveal" | "discussion" | "voting" | "result";

export type RoundOutcome =
  "innocents" | "impostors_wrong_vote" | "impostors_wo";

export interface RoundResult {
  outcome: RoundOutcome;
  winningRole: PlayerRole;
  votedPlayers: PlayerAssignment[];
  impostors: Player[];
  isWalkover: boolean;
}
