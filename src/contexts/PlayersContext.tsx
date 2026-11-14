import { PLAYER_COLORS } from "@/constants/theme";
import { Player, PlayerActionResult } from "@/types/player";
import React, { createContext, useCallback, useMemo, useState } from "react";

export const MAX_PLAYERS = 20;
export const MAX_PLAYER_NAME_LENGTH = 24;

export interface PlayersContextValue {
  players: Player[];
  addPlayer: (name: string) => PlayerActionResult;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => PlayerActionResult;
  clearPlayers: () => void;
}

export const PlayersContext = createContext<PlayersContextValue | null>(null);

function createPlayerId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function validatePlayerName(
  rawName: string,
  existingPlayers: Player[],
  ignoreId?: string,
): { valid: true; normalized: string } | { valid: false; error: string } {
  const normalized = rawName.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return { valid: false, error: "Digite o nome do jogador." };
  }

  if (normalized.length > MAX_PLAYER_NAME_LENGTH) {
    return {
      valid: false,
      error: `O nome deve ter no máximo ${MAX_PLAYER_NAME_LENGTH} caracteres.`,
    };
  }

  const lower = normalized.toLowerCase();
  const hasDuplicate = existingPlayers.some(
    (player) => player.id !== ignoreId && player.name.toLowerCase() === lower,
  );

  if (hasDuplicate) {
    return { valid: false, error: "Já existe um jogador com esse nome." };
  }

  return { valid: true, normalized };
}

interface PlayersProviderProps {
  children: React.ReactNode;
}

export function PlayersProvider({ children }: PlayersProviderProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  const addPlayer = useCallback(
    (rawName: string): PlayerActionResult => {
      if (players.length >= MAX_PLAYERS) {
        return {
          ok: false,
          error: `Limite máximo de ${MAX_PLAYERS} jogadores atingido.`,
        };
      }

      const validation = validatePlayerName(rawName, players);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }

      const color = PLAYER_COLORS[players.length % PLAYER_COLORS.length];
      const newPlayer: Player = {
        id: createPlayerId(),
        name: validation.normalized,
        color,
      };

      setPlayers((prev) => [...prev, newPlayer]);
      return { ok: true };
    },
    [players],
  );

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id));
  }, []);

  const updatePlayerName = useCallback(
    (id: string, rawName: string): PlayerActionResult => {
      const validation = validatePlayerName(rawName, players, id);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }

      setPlayers((prev) =>
        prev.map((player) =>
          player.id === id
            ? { ...player, name: validation.normalized }
            : player,
        ),
      );
      return { ok: true };
    },
    [players],
  );

  const clearPlayers = useCallback(() => {
    setPlayers([]);
  }, []);

  const value = useMemo<PlayersContextValue>(
    () => ({
      players,
      addPlayer,
      removePlayer,
      updatePlayerName,
      clearPlayers,
    }),
    [players, addPlayer, removePlayer, updatePlayerName, clearPlayers],
  );

  return (
    <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>
  );
}
