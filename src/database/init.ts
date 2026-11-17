import type { SQLiteDatabase } from "expo-sqlite";
import { DATABASE_VERSION } from "./constants";
import { SCHEMA_V1_SQL } from "./schema";
import { seedDefaultGameContent } from "./seed";

interface UserVersionRow {
  user_version: number;
}

/**
 * Configures SQLite pragmas, runs versioned schema migrations, and seeds initial game content.
 */
export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON;");

  try {
    await db.execAsync("PRAGMA journal_mode = WAL;");
  } catch {
    // WAL mode may not be supported on all web/virtual filesystems; ignore safely.
  }

  const versionRow = await db.getFirstAsync<UserVersionRow>(
    "PRAGMA user_version;",
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < DATABASE_VERSION) {
    await db.withTransactionAsync(async () => {
      if (currentVersion < 1) {
        await db.execAsync(SCHEMA_V1_SQL);
      }

      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
  }

  await seedDefaultGameContent(db);
}
