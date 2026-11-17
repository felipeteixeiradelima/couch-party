import { getSeedData } from "@/data/gameContent";
import { DbGameContentType } from "@/types/database";
import type { SQLiteDatabase } from "expo-sqlite";

interface CategoryRow {
  id: number;
  slug: string;
  game_type: DbGameContentType;
}

/**
 * Seeds built-in categories and game items from data.json idempotently.
 * Custom user-created content (is_custom = 1) is never overwritten.
 */
export async function seedDefaultGameContent(
  db: SQLiteDatabase,
): Promise<void> {
  const seedData = getSeedData();
  const expectedDefaults = seedData.game_items.filter(
    (item) => item.is_custom === 0,
  ).length;

  const existingDefaultCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM game_items WHERE is_custom = 0",
  );

  if ((existingDefaultCount?.count ?? 0) >= expectedDefaults) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const category of seedData.categories) {
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (slug, game_type, name, is_custom)
         VALUES (?, ?, ?, ?)`,
        [category.slug, category.game_type, category.name, category.is_custom],
      );
    }

    const categoryRows = await db.getAllAsync<CategoryRow>(
      "SELECT id, slug, game_type FROM categories",
    );

    const categoryIdMap = new Map<string, number>();
    for (const row of categoryRows) {
      categoryIdMap.set(`${row.game_type}:${row.slug}`, row.id);
    }

    for (const item of seedData.game_items) {
      const categoryId = categoryIdMap.get(
        `${item.game_type}:${item.category_slug}`,
      );
      if (categoryId == null) continue;

      await db.runAsync(
        `INSERT OR IGNORE INTO game_items (
           slug, game_type, category_id, main_content, impostor_content, hints_json, is_custom, is_active
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.slug,
          item.game_type,
          categoryId,
          item.main_content,
          item.impostor_content,
          JSON.stringify(item.hints),
          item.is_custom,
          item.is_active,
        ],
      );
    }
  });
}
