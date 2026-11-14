import rawMockData from "@/data/mock-data.json";
import {
  GameCategorySummary,
  MockGameData,
  SupportedPartyGameId,
} from "@/types/game";

const gameData: MockGameData = rawMockData as MockGameData;

/**
 * Returns the typed mock dataset for Impostor and Perguntas.
 */
export function getMockGameData(): MockGameData {
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
