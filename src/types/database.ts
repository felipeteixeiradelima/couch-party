import { CidadeDormeRole, CidadeDormeWinner } from "./cidadeDorme";
import { GameId, PlayerRole, RoundOutcome, SupportedPartyGameId } from "./game";

export type DbGameContentType = SupportedPartyGameId;
export type DbGameType = GameId;
export type DbWinnerSide = "innocents" | "impostors" | CidadeDormeWinner;
export type DbOutcomeDetail = RoundOutcome | CidadeDormeWinner;
export type DbParticipantRole = PlayerRole | CidadeDormeRole;
export type DbAlignment = "innocent" | "impostor";

export interface CategoryRecord {
  id: number;
  slug: string;
  gameType: DbGameContentType;
  name: string;
  isCustom: boolean;
  createdAt: string;
}

export interface GameItemRecord {
  id: number;
  slug: string;
  gameType: DbGameContentType;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  mainContent: string;
  impostorContent: string | null;
  hints: string[];
  isCustom: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCustomGameItemInput {
  gameType: DbGameContentType;
  categoryId: number;
  mainContent: string;
  impostorContent?: string | null;
  hints?: string[];
}

export interface UpdateCustomGameItemInput {
  categoryId?: number;
  mainContent?: string;
  impostorContent?: string | null;
  hints?: string[];
  isActive?: boolean;
}

export interface MatchParticipantInput {
  playerId: number | null;
  playerName: string;
  avatarColor: string;
  role: DbParticipantRole;
  alignment: DbAlignment;
  won: boolean;
  survived?: boolean | null;
}

export interface RecordMatchInput {
  gameType: DbGameType;
  winnerSide: DbWinnerSide;
  outcomeDetail: DbOutcomeDetail;
  gameItemId?: number | null;
  roundsCount?: number;
  participants: MatchParticipantInput[];
}

export interface MatchParticipantRecord {
  id: number;
  matchId: number;
  playerId: number | null;
  playerName: string;
  avatarColor: string;
  role: DbParticipantRole;
  alignment: DbAlignment;
  won: boolean;
  survived: boolean | null;
}

export interface MatchHistoryRecord {
  id: number;
  gameType: DbGameType;
  winnerSide: DbWinnerSide;
  outcomeDetail: DbOutcomeDetail;
  gameItemId: number | null;
  itemMainContent: string | null;
  roundsCount: number;
  playerCount: number;
  playedAt: string;
  participants: MatchParticipantRecord[];
}

export interface PlayerLeaderboardEntry {
  playerId: number | null;
  playerName: string;
  avatarColor: string;
  gamesPlayed: number;
  wins: number;
  impostorGames: number;
  impostorWins: number;
  innocentGames: number;
  innocentWins: number;
}
