import {
  DbAlignment,
  DbGameType,
  DbOutcomeDetail,
  DbParticipantRole,
  DbWinnerSide,
  MatchHistoryRecord,
  MatchParticipantRecord,
  RecordMatchInput,
} from "@/types/database";
import type { SQLiteDatabase } from "expo-sqlite";

interface MatchRow {
  id: number;
  game_type: DbGameType;
  winner_side: DbWinnerSide;
  outcome_detail: DbOutcomeDetail;
  game_item_id: number | null;
  item_main_content: string | null;
  rounds_count: number;
  player_count: number;
  played_at: string;
}

interface MatchParticipantRow {
  id: number;
  match_id: number;
  player_id: number | null;
  player_name: string;
  avatar_color: string;
  role: DbParticipantRole;
  alignment: DbAlignment;
  won: number;
  survived: number | null;
}

export async function recordMatch(
  db: SQLiteDatabase,
  input: RecordMatchInput,
): Promise<number> {
  if (input.participants.length === 0) {
    throw new Error("Uma partida precisa de ao menos um participante.");
  }

  let matchId = 0;

  await db.withTransactionAsync(async () => {
    const matchResult = await db.runAsync(
      `INSERT INTO match_history (
         game_type, winner_side, outcome_detail, game_item_id, rounds_count, player_count
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.gameType,
        input.winnerSide,
        input.outcomeDetail,
        input.gameItemId ?? null,
        input.roundsCount ?? 1,
        input.participants.length,
      ],
    );

    matchId = matchResult.lastInsertRowId;

    for (const participant of input.participants) {
      const wonFlag = participant.won ? 1 : 0;
      const survivedFlag =
        participant.survived === undefined || participant.survived === null
          ? null
          : participant.survived
            ? 1
            : 0;

      await db.runAsync(
        `INSERT INTO match_participants (
           match_id, player_id, player_name, avatar_color, role, alignment, won, survived
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          matchId,
          participant.playerId,
          participant.playerName,
          participant.avatarColor,
          participant.role,
          participant.alignment,
          wonFlag,
          survivedFlag,
        ],
      );

      if (participant.playerId !== null && participant.playerId > 0) {
        const isImpostor = participant.alignment === "impostor" ? 1 : 0;
        const impostorWon =
          participant.alignment === "impostor" && participant.won ? 1 : 0;

        await db.runAsync(
          `UPDATE players
           SET games_played = games_played + 1,
               wins = wins + ?,
               impostor_games = impostor_games + ?,
               impostor_wins = impostor_wins + ?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?`,
          [wonFlag, isImpostor, impostorWon, participant.playerId],
        );
      }
    }
  });

  return matchId;
}

export async function listRecentMatches(
  db: SQLiteDatabase,
  limit = 20,
): Promise<MatchHistoryRecord[]> {
  const matchRows = await db.getAllAsync<MatchRow>(
    `SELECT
       mh.id,
       mh.game_type,
       mh.winner_side,
       mh.outcome_detail,
       mh.game_item_id,
       gi.main_content AS item_main_content,
       mh.rounds_count,
       mh.player_count,
       mh.played_at
     FROM match_history mh
     LEFT JOIN game_items gi ON gi.id = mh.game_item_id
     ORDER BY mh.played_at DESC, mh.id DESC
     LIMIT ?`,
    [limit],
  );

  if (matchRows.length === 0) {
    return [];
  }

  const matchIds = matchRows.map((row) => row.id);
  const placeholders = matchIds.map(() => "?").join(", ");
  const participantRows = await db.getAllAsync<MatchParticipantRow>(
    `SELECT
       id, match_id, player_id, player_name, avatar_color, role, alignment, won, survived
     FROM match_participants
     WHERE match_id IN (${placeholders})
     ORDER BY id ASC`,
    matchIds,
  );

  const participantsByMatch = new Map<number, MatchParticipantRecord[]>();
  for (const row of participantRows) {
    const list = participantsByMatch.get(row.match_id) ?? [];
    list.push({
      id: row.id,
      matchId: row.match_id,
      playerId: row.player_id,
      playerName: row.player_name,
      avatarColor: row.avatar_color,
      role: row.role,
      alignment: row.alignment,
      won: row.won === 1,
      survived: row.survived === null ? null : row.survived === 1,
    });
    participantsByMatch.set(row.match_id, list);
  }

  return matchRows.map((row) => ({
    id: row.id,
    gameType: row.game_type,
    winnerSide: row.winner_side,
    outcomeDetail: row.outcome_detail,
    gameItemId: row.game_item_id,
    itemMainContent: row.item_main_content,
    roundsCount: row.rounds_count,
    playerCount: row.player_count,
    playedAt: row.played_at,
    participants: participantsByMatch.get(row.id) ?? [],
  }));
}

export async function clearMatchHistory(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM match_history");
    await db.runAsync(
      `UPDATE players
       SET games_played = 0,
           wins = 0,
           impostor_games = 0,
           impostor_wins = 0,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    );
  });
}
