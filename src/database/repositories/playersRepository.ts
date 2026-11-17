import { DbGameType, PlayerLeaderboardEntry } from "@/types/database";
import { Player } from "@/types/player";
import type { SQLiteDatabase } from "expo-sqlite";

interface PlayerRow {
  id: number;
  name: string;
  avatar_color: string;
  games_played: number;
  wins: number;
  impostor_games: number;
  impostor_wins: number;
}

interface LeaderboardRow {
  player_id: number | null;
  player_name: string;
  avatar_color: string;
  games_played: number;
  wins: number;
  impostor_games: number;
  impostor_wins: number;
  innocent_games: number;
  innocent_wins: number;
}

function mapPlayerRow(row: PlayerRow): Player {
  return {
    id: String(row.id),
    name: row.name,
    color: row.avatar_color,
    gamesPlayed: row.games_played,
    wins: row.wins,
    impostorGames: row.impostor_games,
    impostorWins: row.impostor_wins,
  };
}

export function parsePlayerDbId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function listActivePlayers(db: SQLiteDatabase): Promise<Player[]> {
  const rows = await db.getAllAsync<PlayerRow>(
    `SELECT id, name, avatar_color, games_played, wins, impostor_games, impostor_wins
     FROM players
     WHERE is_active = 1
     ORDER BY sort_order ASC, id ASC`,
  );

  return rows.map(mapPlayerRow);
}

export async function listFrequentPlayers(
  db: SQLiteDatabase,
  limit = 20,
): Promise<Player[]> {
  const rows = await db.getAllAsync<PlayerRow>(
    `SELECT id, name, avatar_color, games_played, wins, impostor_games, impostor_wins
     FROM players
     WHERE is_active = 0
     ORDER BY games_played DESC, wins DESC, updated_at DESC, id DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map(mapPlayerRow);
}

export async function addOrReactivatePlayer(
  db: SQLiteDatabase,
  name: string,
  fallbackColor: string,
): Promise<Player> {
  let createdOrUpdatedId = 0;

  await db.withTransactionAsync(async () => {
    const maxOrderRow = await db.getFirstAsync<{ max_order: number | null }>(
      "SELECT MAX(sort_order) AS max_order FROM players WHERE is_active = 1",
    );
    const nextSortOrder = (maxOrderRow?.max_order ?? -1) + 1;

    const inactiveMatch = await db.getFirstAsync<{ id: number }>(
      `SELECT id
       FROM players
       WHERE is_active = 0 AND name = ? COLLATE NOCASE
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      [name],
    );

    if (inactiveMatch) {
      await db.runAsync(
        `UPDATE players
         SET is_active = 1,
             name = ?,
             sort_order = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
        [name, nextSortOrder, inactiveMatch.id],
      );
      createdOrUpdatedId = inactiveMatch.id;
    } else {
      const result = await db.runAsync(
        `INSERT INTO players (name, avatar_color, is_active, sort_order)
         VALUES (?, ?, 1, ?)`,
        [name, fallbackColor, nextSortOrder],
      );
      createdOrUpdatedId = result.lastInsertRowId;
    }
  });

  const savedRow = await db.getFirstAsync<PlayerRow>(
    `SELECT id, name, avatar_color, games_played, wins, impostor_games, impostor_wins
     FROM players
     WHERE id = ?`,
    [createdOrUpdatedId],
  );

  if (!savedRow) {
    throw new Error("Falha ao carregar jogador salvo no banco de dados.");
  }

  return mapPlayerRow(savedRow);
}

export async function updatePlayerName(
  db: SQLiteDatabase,
  id: string,
  name: string,
): Promise<Player | null> {
  const dbId = parsePlayerDbId(id);
  if (dbId === null) {
    return null;
  }

  await db.runAsync(
    `UPDATE players
     SET name = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
    [name, dbId],
  );

  const row = await db.getFirstAsync<PlayerRow>(
    `SELECT id, name, avatar_color, games_played, wins, impostor_games, impostor_wins
     FROM players
     WHERE id = ?`,
    [dbId],
  );

  return row ? mapPlayerRow(row) : null;
}

export async function removeActivePlayer(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  const dbId = parsePlayerDbId(id);
  if (dbId === null) {
    return;
  }

  const row = await db.getFirstAsync<{ games_played: number }>(
    "SELECT games_played FROM players WHERE id = ?",
    [dbId],
  );

  if (!row) {
    return;
  }

  if (row.games_played > 0) {
    await db.runAsync(
      `UPDATE players
       SET is_active = 0,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
      [dbId],
    );
  } else {
    await db.runAsync("DELETE FROM players WHERE id = ?", [dbId]);
  }
}

export async function clearActivePlayers(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE players
       SET is_active = 0,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE is_active = 1 AND games_played > 0`,
    );

    await db.runAsync(
      "DELETE FROM players WHERE is_active = 1 AND games_played = 0",
    );
  });
}

export async function getLeaderboard(
  db: SQLiteDatabase,
  options?: { todayOnly?: boolean; gameType?: DbGameType },
): Promise<PlayerLeaderboardEntry[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.todayOnly) {
    conditions.push(
      "date(mh.played_at, 'localtime') = date('now', 'localtime')",
    );
  }

  if (options?.gameType) {
    conditions.push("mh.game_type = ?");
    params.push(options.gameType);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.getAllAsync<LeaderboardRow>(
    `SELECT
       mp.player_id AS player_id,
       COALESCE(p.name, MAX(mp.player_name)) AS player_name,
       COALESCE(p.avatar_color, MAX(mp.avatar_color)) AS avatar_color,
       COUNT(*) AS games_played,
       SUM(mp.won) AS wins,
       SUM(CASE WHEN mp.alignment = 'impostor' THEN 1 ELSE 0 END) AS impostor_games,
       SUM(CASE WHEN mp.alignment = 'impostor' AND mp.won = 1 THEN 1 ELSE 0 END) AS impostor_wins,
       SUM(CASE WHEN mp.alignment = 'innocent' THEN 1 ELSE 0 END) AS innocent_games,
       SUM(CASE WHEN mp.alignment = 'innocent' AND mp.won = 1 THEN 1 ELSE 0 END) AS innocent_wins
     FROM match_participants mp
     INNER JOIN match_history mh ON mh.id = mp.match_id
     LEFT JOIN players p ON p.id = mp.player_id
     ${whereClause}
     GROUP BY COALESCE(CAST(mp.player_id AS TEXT), 'name:' || LOWER(mp.player_name))
     ORDER BY wins DESC, impostor_wins DESC, games_played DESC, player_name ASC`,
    params,
  );

  return rows.map((row) => ({
    playerId: row.player_id,
    playerName: row.player_name,
    avatarColor: row.avatar_color,
    gamesPlayed: row.games_played,
    wins: row.wins,
    impostorGames: row.impostor_games,
    impostorWins: row.impostor_wins,
    innocentGames: row.innocent_games,
    innocentWins: row.innocent_wins,
  }));
}
