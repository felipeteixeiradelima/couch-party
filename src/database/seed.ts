import { getMockGameData } from "@/data/gameContent";
import { DbGameContentType } from "@/types/database";
import type { SQLiteDatabase } from "expo-sqlite";

interface CategoryRow {
  id: number;
  slug: string;
  game_type: DbGameContentType;
}

/**
 * Seeds built-in categories and game items from mock-data.json idempotently.
 * Custom user-created content (is_custom = 1) is never overwritten.
 */
export async function seedDefaultGameContent(
  db: SQLiteDatabase,
): Promise<void> {
  const existingDefaultCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM game_items WHERE is_custom = 0",
  );

  const mockData = getMockGameData();
  const totalExpectedDefaults =
    mockData.impostor.categories.reduce(
      (acc, category) => acc + category.items.length,
      0,
    ) +
    mockData.perguntas.categories.reduce(
      (acc, category) => acc + category.items.length,
      0,
    );

  if ((existingDefaultCount?.count ?? 0) >= totalExpectedDefaults) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const category of mockData.impostor.categories) {
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (slug, game_type, name, is_custom)
         VALUES (?, 'impostor', ?, 0)`,
        [category.id, category.name],
      );
    }

    for (const category of mockData.perguntas.categories) {
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (slug, game_type, name, is_custom)
         VALUES (?, 'perguntas', ?, 0)`,
        [category.id, category.name],
      );
    }

    const categoryRows = await db.getAllAsync<CategoryRow>(
      "SELECT id, slug, game_type FROM categories",
    );

    const categoryIdMap = new Map<string, number>();
    for (const row of categoryRows) {
      categoryIdMap.set(`${row.game_type}:${row.slug}`, row.id);
    }

    for (const category of mockData.impostor.categories) {
      const categoryId = categoryIdMap.get(`impostor:${category.id}`);
      if (categoryId == null) continue;

      for (const item of category.items) {
        await db.runAsync(
          `INSERT OR IGNORE INTO game_items (
             slug, game_type, category_id, main_content, impostor_content, hints_json, is_custom, is_active
           ) VALUES (?, 'impostor', ?, ?, NULL, ?, 0, 1)`,
          [item.id, categoryId, item.word, JSON.stringify(item.hints)],
        );
      }
    }

    for (const category of mockData.perguntas.categories) {
      const categoryId = categoryIdMap.get(`perguntas:${category.id}`);
      if (categoryId == null) continue;

      for (const item of category.items) {
        await db.runAsync(
          `INSERT OR IGNORE INTO game_items (
             slug, game_type, category_id, main_content, impostor_content, hints_json, is_custom, is_active
           ) VALUES (?, 'perguntas', ?, ?, ?, ?, 0, 1)`,
          [
            item.id,
            categoryId,
            item.innocentQuestion,
            item.impostorQuestion,
            JSON.stringify(item.hints ?? []),
          ],
        );
      }
    }
  });
}
