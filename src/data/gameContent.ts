import rawSeedData from "@/data/data.json";
import {
  DatabaseSeedData,
  GameCategorySummary,
  GameData,
  ImpostorCategory,
  QuestionCategory,
  SupportedPartyGameId,
} from "@/types/game";

const seedData: DatabaseSeedData = rawSeedData as DatabaseSeedData;

function buildGameData(seed: DatabaseSeedData): GameData {
  const impostorMap = new Map<string, ImpostorCategory>();
  const questionMap = new Map<string, QuestionCategory>();

  for (const category of seed.categories) {
    if (category.game_type === "impostor") {
      impostorMap.set(category.slug, {
        id: category.slug,
        name: category.name,
        isCustom: category.is_custom === 1,
        items: [],
      });
    } else {
      questionMap.set(category.slug, {
        id: category.slug,
        name: category.name,
        isCustom: category.is_custom === 1,
        items: [],
      });
    }
  }

  for (const item of seed.game_items) {
    if (item.is_active !== 1) continue;

    if (item.game_type === "impostor") {
      const category = impostorMap.get(item.category_slug);
      if (!category) continue;

      category.items.push({
        id: item.slug,
        word: item.main_content,
        hints: item.hints,
        isCustom: item.is_custom === 1,
      });
    } else if (item.impostor_content) {
      const category = questionMap.get(item.category_slug);
      if (!category) continue;

      category.items.push({
        id: item.slug,
        innocentQuestion: item.main_content,
        impostorQuestion: item.impostor_content,
        hints: item.hints.length > 0 ? item.hints : undefined,
        isCustom: item.is_custom === 1,
      });
    }
  }

  return {
    impostor: { categories: Array.from(impostorMap.values()) },
    perguntas: { categories: Array.from(questionMap.values()) },
  };
}

const gameData: GameData = buildGameData(seedData);

/**
 * Returns the raw SQLite-structured seed dataset from data.json.
 */
export function getSeedData(): DatabaseSeedData {
  return seedData;
}

/**
 * Returns the grouped game dataset for Impostor and Perguntas.
 */
export function getGameData(): GameData {
  return gameData;
}

/**
 * Lists all selectable categories for a given party game.
 */
export function getGameCategories(
  gameId: SupportedPartyGameId,
): GameCategorySummary[] {
  const categories =
    gameId === "impostor"
      ? gameData.impostor.categories
      : gameData.perguntas.categories;

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    itemCount: category.items.length,
  }));
}
