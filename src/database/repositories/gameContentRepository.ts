import {
  CategoryRecord,
  CreateCustomGameItemInput,
  DbGameContentType,
  GameItemRecord,
  UpdateCustomGameItemInput,
} from "@/types/database";
import {
  GameCategorySummary,
  ImpostorCategory,
  QuestionCategory,
} from "@/types/game";
import type { SQLiteBindValue, SQLiteDatabase } from "expo-sqlite";

interface CategorySummaryRow {
  slug: string;
  name: string;
  item_count: number;
}

interface CategoryRow {
  id: number;
  slug: string;
  game_type: DbGameContentType;
  name: string;
  is_custom: number;
  created_at: string;
}

interface GameItemJoinedRow {
  id: number;
  slug: string;
  game_type: DbGameContentType;
  category_id: number;
  category_slug: string;
  category_name: string;
  category_is_custom: number;
  main_content: string;
  impostor_content: string | null;
  hints_json: string;
  is_custom: number;
  is_active: number;
  created_at: string;
}

const GAME_ITEMS_SELECT_BASE = `
  SELECT
    gi.id,
    gi.slug,
    gi.game_type,
    gi.category_id,
    c.slug AS category_slug,
    c.name AS category_name,
    c.is_custom AS category_is_custom,
    gi.main_content,
    gi.impostor_content,
    gi.hints_json,
    gi.is_custom,
    gi.is_active,
    gi.created_at
  FROM game_items gi
  INNER JOIN categories c ON c.id = gi.category_id
`;

function parseHintsJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  } catch {
    return [];
  }
}

function createSlug(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function mapCategoryRow(row: CategoryRow): CategoryRecord {
  return {
    id: row.id,
    slug: row.slug,
    gameType: row.game_type,
    name: row.name,
    isCustom: row.is_custom === 1,
    createdAt: row.created_at,
  };
}

function mapGameItemRow(row: GameItemJoinedRow): GameItemRecord {
  return {
    id: row.id,
    slug: row.slug,
    gameType: row.game_type,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    mainContent: row.main_content,
    impostorContent: row.impostor_content,
    hints: parseHintsJson(row.hints_json),
    isCustom: row.is_custom === 1,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

async function queryJoinedGameItems(
  db: SQLiteDatabase,
  whereClause: string,
  params: SQLiteBindValue[],
  orderBy = "c.is_custom ASC, c.id ASC, gi.id ASC",
): Promise<GameItemJoinedRow[]> {
  return db.getAllAsync<GameItemJoinedRow>(
    `${GAME_ITEMS_SELECT_BASE}
     WHERE ${whereClause}
     ORDER BY ${orderBy}`,
    params,
  );
}

async function getJoinedGameItemById(
  db: SQLiteDatabase,
  id: number,
): Promise<GameItemJoinedRow | null> {
  return db.getFirstAsync<GameItemJoinedRow>(
    `${GAME_ITEMS_SELECT_BASE}
     WHERE gi.id = ?`,
    [id],
  );
}

export async function getCategoriesByGame(
  db: SQLiteDatabase,
  gameType: DbGameContentType,
): Promise<GameCategorySummary[]> {
  const rows = await db.getAllAsync<CategorySummaryRow>(
    `SELECT
       c.slug AS slug,
       c.name AS name,
       COUNT(gi.id) AS item_count
     FROM categories c
     INNER JOIN game_items gi
       ON gi.category_id = c.id
      AND gi.is_active = 1
     WHERE c.game_type = ?
     GROUP BY c.id
     HAVING COUNT(gi.id) > 0
     ORDER BY c.is_custom ASC, c.id ASC`,
    [gameType],
  );

  return rows.map((row) => ({
    id: row.slug,
    name: row.name,
    itemCount: row.item_count,
  }));
}

export async function getAllCategoriesByGame(
  db: SQLiteDatabase,
  gameType: DbGameContentType,
): Promise<CategoryRecord[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, slug, game_type, name, is_custom, created_at
     FROM categories
     WHERE game_type = ?
     ORDER BY is_custom ASC, id ASC`,
    [gameType],
  );

  return rows.map(mapCategoryRow);
}

export async function getPlayableImpostorCategories(
  db: SQLiteDatabase,
): Promise<ImpostorCategory[]> {
  const rows = await queryJoinedGameItems(
    db,
    "gi.game_type = 'impostor' AND gi.is_active = 1",
    [],
  );

  const grouped = new Map<string, ImpostorCategory>();

  for (const row of rows) {
    let category = grouped.get(row.category_slug);
    if (!category) {
      category = {
        id: row.category_slug,
        dbId: row.category_id,
        name: row.category_name,
        isCustom: row.category_is_custom === 1,
        items: [],
      };
      grouped.set(row.category_slug, category);
    }

    const parsedHints = parseHintsJson(row.hints_json);
    const hints =
      parsedHints.length > 0
        ? parsedHints
        : row.impostor_content
          ? [row.impostor_content]
          : [];

    category.items.push({
      id: row.slug,
      dbId: row.id,
      word: row.main_content,
      hints,
      isCustom: row.is_custom === 1,
    });
  }

  return Array.from(grouped.values());
}

export async function getPlayableQuestionCategories(
  db: SQLiteDatabase,
): Promise<QuestionCategory[]> {
  const rows = await queryJoinedGameItems(
    db,
    "gi.game_type = 'perguntas' AND gi.is_active = 1 AND gi.impostor_content IS NOT NULL",
    [],
  );

  const grouped = new Map<string, QuestionCategory>();

  for (const row of rows) {
    if (!row.impostor_content) continue;

    let category = grouped.get(row.category_slug);
    if (!category) {
      category = {
        id: row.category_slug,
        dbId: row.category_id,
        name: row.category_name,
        isCustom: row.category_is_custom === 1,
        items: [],
      };
      grouped.set(row.category_slug, category);
    }

    const hints = parseHintsJson(row.hints_json);
    category.items.push({
      id: row.slug,
      dbId: row.id,
      innocentQuestion: row.main_content,
      impostorQuestion: row.impostor_content,
      hints: hints.length > 0 ? hints : undefined,
      isCustom: row.is_custom === 1,
    });
  }

  return Array.from(grouped.values());
}

export async function listGameItems(
  db: SQLiteDatabase,
  gameType: DbGameContentType,
  options?: { categorySlug?: string; onlyCustom?: boolean },
): Promise<GameItemRecord[]> {
  const conditions: string[] = ["gi.game_type = ?", "gi.is_active = 1"];
  const params: SQLiteBindValue[] = [gameType];

  if (options?.categorySlug) {
    conditions.push("c.slug = ?");
    params.push(options.categorySlug);
  }

  if (options?.onlyCustom) {
    conditions.push("gi.is_custom = 1");
  }

  const rows = await queryJoinedGameItems(
    db,
    conditions.join(" AND "),
    params,
    "gi.is_custom DESC, gi.id DESC",
  );

  return rows.map(mapGameItemRow);
}

export async function createCustomCategory(
  db: SQLiteDatabase,
  gameType: DbGameContentType,
  rawName: string,
): Promise<CategoryRecord> {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) {
    throw new Error("Informe um nome válido para a categoria.");
  }

  const existing = await db.getFirstAsync<CategoryRow>(
    `SELECT id, slug, game_type, name, is_custom, created_at
     FROM categories
     WHERE game_type = ? AND name = ? COLLATE NOCASE
     LIMIT 1`,
    [gameType, name],
  );

  if (existing) {
    return mapCategoryRow(existing);
  }

  const slug = createSlug("custom-cat");
  const result = await db.runAsync(
    `INSERT INTO categories (slug, game_type, name, is_custom)
     VALUES (?, ?, ?, 1)`,
    [slug, gameType, name],
  );

  const created = await db.getFirstAsync<CategoryRow>(
    `SELECT id, slug, game_type, name, is_custom, created_at
     FROM categories
     WHERE id = ?`,
    [result.lastInsertRowId],
  );

  if (!created) {
    throw new Error("Não foi possível criar a categoria personalizada.");
  }

  return mapCategoryRow(created);
}

export async function createCustomGameItem(
  db: SQLiteDatabase,
  input: CreateCustomGameItemInput,
): Promise<GameItemRecord> {
  const mainContent = input.mainContent.trim();
  const impostorContent = input.impostorContent?.trim() || null;
  const hints = (input.hints ?? [])
    .map((hint) => hint.trim())
    .filter((hint) => hint.length > 0);

  if (!mainContent) {
    throw new Error("O conteúdo principal não pode ficar vazio.");
  }

  if (input.gameType === "perguntas" && !impostorContent) {
    throw new Error("A pergunta do impostor não pode ficar vazia.");
  }

  const slug = createSlug("custom-item");
  const result = await db.runAsync(
    `INSERT INTO game_items (
       slug, game_type, category_id, main_content, impostor_content, hints_json, is_custom, is_active
     ) VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
    [
      slug,
      input.gameType,
      input.categoryId,
      mainContent,
      impostorContent,
      JSON.stringify(hints),
    ],
  );

  const created = await getJoinedGameItemById(db, result.lastInsertRowId);

  if (!created) {
    throw new Error("Não foi possível salvar a carta personalizada.");
  }

  return mapGameItemRow(created);
}

export async function updateCustomGameItem(
  db: SQLiteDatabase,
  id: number,
  input: UpdateCustomGameItemInput,
): Promise<GameItemRecord | null> {
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM game_items WHERE id = ? AND is_custom = 1",
    [id],
  );

  if (!existing) {
    return null;
  }

  const updates: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (input.categoryId !== undefined) {
    updates.push("category_id = ?");
    params.push(input.categoryId);
  }

  if (input.mainContent !== undefined) {
    const trimmed = input.mainContent.trim();
    if (!trimmed) {
      throw new Error("O conteúdo principal não pode ficar vazio.");
    }
    updates.push("main_content = ?");
    params.push(trimmed);
  }

  if (input.impostorContent !== undefined) {
    updates.push("impostor_content = ?");
    params.push(input.impostorContent ? input.impostorContent.trim() : null);
  }

  if (input.hints !== undefined) {
    const normalizedHints = input.hints
      .map((hint) => hint.trim())
      .filter((hint) => hint.length > 0);
    updates.push("hints_json = ?");
    params.push(JSON.stringify(normalizedHints));
  }

  if (input.isActive !== undefined) {
    updates.push("is_active = ?");
    params.push(input.isActive ? 1 : 0);
  }

  if (updates.length > 0) {
    params.push(id);
    await db.runAsync(
      `UPDATE game_items SET ${updates.join(", ")} WHERE id = ? AND is_custom = 1`,
      params,
    );
  }

  const updated = await getJoinedGameItemById(db, id);
  return updated ? mapGameItemRow(updated) : null;
}

export async function deleteCustomGameItem(
  db: SQLiteDatabase,
  id: number,
): Promise<boolean> {
  const result = await db.runAsync(
    "DELETE FROM game_items WHERE id = ? AND is_custom = 1",
    [id],
  );

  return result.changes > 0;
}
