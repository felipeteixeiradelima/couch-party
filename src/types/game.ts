export type GameId = "impostor" | "cidade-dorme" | "perguntas";

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
