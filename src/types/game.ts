import { Player } from "./player";

export type GameId = "impostor" | "cidade-dorme" | "perguntas";

export type SupportedPartyGameId = "impostor" | "perguntas";

export type GameRoute =
  | "/games/impostor"
  | "/games/cidade-dorme"
  | "/games/perguntas";

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
  word: string;
  hints: string[];
}

export interface ImpostorCategory {
  id: string;
  name: string;
  items: ImpostorWordItem[];
}

export interface QuestionPairItem {
  id: string;
  innocentQuestion: string;
  impostorQuestion: string;
  hints: string[];
}

export interface QuestionCategory {
  id: string;
  name: string;
  items: QuestionPairItem[];
}

export interface MockGameData {
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
      secretWord: string;
      impostorHint: string | null;
    }
  | {
      gameId: "perguntas";
      categoryId: string;
      categoryName: string;
      itemId: string;
      innocentQuestion: string;
      impostorQuestion: string;
      impostorHint: string | null;
    };

export interface ActiveRoundState {
  roundNumber: number;
  assignments: PlayerAssignment[];
  prompt: RoundPrompt;
  settingsSnapshot: GameSettings;
}

export type GamePhase = "lobby" | "reveal" | "discussion" | "voting" | "result";

export type RoundOutcome = "innocents" | "impostors_wrong_vote" | "impostors_wo";

export interface RoundResult {
  outcome: RoundOutcome;
  winningRole: PlayerRole;
  votedPlayer: Player | null;
  votedPlayerRole: PlayerRole | null;
  impostors: Player[];
  isWalkover: boolean;
}
