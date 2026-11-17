export interface Player {
  id: string;
  name: string;
  color: string;
  gamesPlayed: number;
  wins: number;
  impostorGames: number;
  impostorWins: number;
}

export interface PlayerActionResult {
  ok: boolean;
  error?: string;
}
