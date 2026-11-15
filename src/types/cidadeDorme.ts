import { Player } from "./player";

export type CidadeDormeRole =
  "assassin" | "detective" | "guardian_angel" | "citizen";

export interface CidadeDormeSettings {
  assassinCount: number;
  detectiveCount: number;
  guardianAngelCount: number;
  votingTimerEnabled: boolean;
  votingDurationSeconds: number;
}

export interface CidadeDormeEliminationInfo {
  kind: "night" | "day";
  round: number;
}

export interface CidadeDormePlayerState {
  player: Player;
  role: CidadeDormeRole;
  alive: boolean;
  eliminatedPhase: CidadeDormeEliminationInfo | null;
}

export interface CidadeDormeNightSummary {
  nightNumber: number;
  attackedPlayerId: string | null;
  protectedPlayerId: string | null;
  killedPlayerId: string | null;
  wasSaved: boolean;
}

export interface CidadeDormeHistoryEntry {
  id: string;
  cycleNumber: number;
  phase: "night" | "day";
  message: string;
  tone: "danger" | "success" | "neutral";
}

export type CidadeDormeWinner = "citizens" | "assassins";

export type CidadeDormePhase =
  | "lobby"
  | "role-reveal"
  | "night-intro"
  | "night-pass"
  | "day-discussion"
  | "day-voting"
  | "day-elimination"
  | "game-over";

export interface CidadeDormeMatchState {
  matchId: number;
  roundNumber: number;
  players: CidadeDormePlayerState[];
  settingsSnapshot: CidadeDormeSettings;
  lastNightSummary: CidadeDormeNightSummary | null;
  lastEliminatedDayPlayer: CidadeDormePlayerState | null;
  detectiveKnowledge: Record<string, "assassin" | "innocent">;
  history: CidadeDormeHistoryEntry[];
  winner: CidadeDormeWinner | null;
}
