/**
 * DDL statements for the Couch Party SQLite schema (version 1).
 */
export const SCHEMA_V1_SQL = `
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  impostor_games INTEGER NOT NULL DEFAULT 0 CHECK (impostor_games >= 0),
  impostor_wins INTEGER NOT NULL DEFAULT 0 CHECK (impostor_wins >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_active_name
  ON players (name COLLATE NOCASE)
  WHERE is_active = 1;

CREATE INDEX IF NOT EXISTS idx_players_active_order
  ON players (is_active, sort_order, id);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('impostor', 'perguntas')),
  name TEXT NOT NULL,
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (game_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_game_type
  ON categories (game_type, name);

CREATE TABLE IF NOT EXISTS game_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('impostor', 'perguntas')),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  main_content TEXT NOT NULL,
  impostor_content TEXT,
  hints_json TEXT NOT NULL DEFAULT '[]',
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (game_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_game_items_lookup
  ON game_items (game_type, category_id, is_active);

CREATE TABLE IF NOT EXISTS match_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_type TEXT NOT NULL CHECK (game_type IN ('impostor', 'perguntas', 'cidade-dorme')),
  winner_side TEXT NOT NULL CHECK (winner_side IN ('innocents', 'impostors', 'citizens', 'assassins')),
  outcome_detail TEXT NOT NULL,
  game_item_id INTEGER REFERENCES game_items(id) ON DELETE SET NULL,
  rounds_count INTEGER NOT NULL DEFAULT 1 CHECK (rounds_count >= 1),
  player_count INTEGER NOT NULL CHECK (player_count >= 1),
  played_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_match_history_played_at
  ON match_history (played_at DESC);

CREATE INDEX IF NOT EXISTS idx_match_history_game_played_at
  ON match_history (game_type, played_at DESC);

CREATE TABLE IF NOT EXISTS match_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES match_history(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  role TEXT NOT NULL CHECK (
    role IN ('innocent', 'impostor', 'citizen', 'detective', 'guardian_angel', 'assassin')
  ),
  alignment TEXT NOT NULL CHECK (alignment IN ('innocent', 'impostor')),
  won INTEGER NOT NULL CHECK (won IN (0, 1)),
  survived INTEGER CHECK (survived IN (0, 1) OR survived IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_match_participants_match_id
  ON match_participants (match_id);

CREATE INDEX IF NOT EXISTS idx_match_participants_player_id
  ON match_participants (player_id);
`;
