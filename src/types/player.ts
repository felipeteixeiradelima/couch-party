export interface Player {
  id: string;
  name: string;
  color: string;
}

export interface PlayerActionResult {
  ok: boolean;
  error?: string;
}
