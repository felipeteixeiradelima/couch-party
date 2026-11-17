import { PLAYER_COLORS } from "@/constants/theme";
import {
  addOrReactivatePlayer,
  clearActivePlayers,
  listActivePlayers,
  removeActivePlayer,
  updatePlayerName as updatePlayerNameInDb,
} from "@/database";
import { Player, PlayerActionResult } from "@/types/player";
import { useSQLiteContext } from "expo-sqlite";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const MAX_PLAYERS = 20;
export const MAX_PLAYER_NAME_LENGTH = 24;

export interface PlayersContextValue {
  players: Player[];
  isHydrated: boolean;
  addPlayer: (name: string) => Promise<PlayerActionResult>;
  removePlayer: (id: string) => Promise<void>;
  updatePlayerName: (id: string, name: string) => Promise<PlayerActionResult>;
  clearPlayers: () => Promise<void>;
  refreshPlayers: () => Promise<void>;
}

export const PlayersContext = createContext<PlayersContextValue | null>(null);

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
  const db = useSQLiteContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshPlayers = useCallback(async () => {
    const loaded = await listActivePlayers(db);
    setPlayers(loaded);
  }, [db]);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const loaded = await listActivePlayers(db);
        if (isMounted) {
          setPlayers(loaded);
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [db]);

  const addPlayer = useCallback(
    async (rawName: string): Promise<PlayerActionResult> => {
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

      try {
        const color = PLAYER_COLORS[players.length % PLAYER_COLORS.length];
        await addOrReactivatePlayer(db, validation.normalized, color);
        await refreshPlayers();
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Não foi possível salvar o jogador no banco de dados.",
        };
      }
    },
    [db, players, refreshPlayers],
  );

  const removePlayer = useCallback(
    async (id: string) => {
      await removeActivePlayer(db, id);
      await refreshPlayers();
    },
    [db, refreshPlayers],
  );

  const updatePlayerName = useCallback(
    async (id: string, rawName: string): Promise<PlayerActionResult> => {
      const validation = validatePlayerName(rawName, players, id);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }

      try {
        await updatePlayerNameInDb(db, id, validation.normalized);
        await refreshPlayers();
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "Não foi possível atualizar o nome no banco de dados.",
        };
      }
    },
    [db, players, refreshPlayers],
  );

  const clearPlayers = useCallback(async () => {
    await clearActivePlayers(db);
    setPlayers([]);
  }, [db]);

  const value = useMemo<PlayersContextValue>(
    () => ({
      players,
      isHydrated,
      addPlayer,
      removePlayer,
      updatePlayerName,
      clearPlayers,
      refreshPlayers,
    }),
    [
      players,
      isHydrated,
      addPlayer,
      removePlayer,
      updatePlayerName,
      clearPlayers,
      refreshPlayers,
    ],
  );

  return (
    <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>
  );
}
