import { GameId, GameMetadata } from "@/types/game";
import { AppTheme, DARK_COLORS } from "./theme";

export interface GameVisuals {
  accentColor: string;
  iconBgColor: string;
}

export function getGameVisuals(gameId: GameId, theme: AppTheme): GameVisuals {
  const { colors, cidadeDorme } = theme;
  switch (gameId) {
    case "impostor":
      return {
        accentColor: colors.primaryText,
        iconBgColor: colors.primarySoft,
      };
    case "cidade-dorme":
      return {
        accentColor: cidadeDorme.night.accent,
        iconBgColor: colors.infoSoft,
      };
    case "perguntas":
      return {
        accentColor: colors.warning,
        iconBgColor: colors.warningSoft,
      };
  }
}

export const GAMES: GameMetadata[] = [
  {
    id: "impostor",
    title: "Impostor",
    description: "Descubra quem não sabe a palavra secreta.",
    minPlayers: 3,
    maxPlayers: 12,
    route: "/games/impostor",
    accentColor: DARK_COLORS.primaryText,
    iconBgColor: "rgba(139, 61, 255, 0.18)",
    rulesSummary: [
      "Todos os jogadores recebem a mesma palavra secreta, exceto o Impostor.",
      "Em roda, cada pessoa dá uma dica curta sobre a palavra sem entregá-la.",
      "O Impostor tenta se misturar fingindo que conhece a palavra.",
      "Após a discussão, o grupo vota para eliminar quem acha ser o Impostor.",
    ],
  },
  {
    id: "cidade-dorme",
    title: "Cidade Dorme",
    description: "Mistério noturno com assassinos, detetive e anjo da guarda.",
    minPlayers: 6,
    maxPlayers: 20,
    route: "/games/cidade-dorme",
    accentColor: "#60A5FA",
    iconBgColor: "rgba(59, 130, 246, 0.18)",
    rulesSummary: [
      "Cada jogador recebe um papel secreto: Assassino, Detetive, Anjo da Guarda ou Cidadão.",
      "À noite, o celular passa de mão em mão em privado e os papéis ativos fazem suas escolhas.",
      "Ao amanhecer, a cidade descobre quem foi atacado (ou salvo pelo Anjo da Guarda) e debate em voz alta.",
      "O grupo vota para eliminar um suspeito. Os Cidadãos vencem ao eliminar todos os Assassinos; os Assassinos vencem ao igualar em número.",
    ],
  },
  {
    id: "perguntas",
    title: "Perguntas",
    description: "Responda e encontre quem recebeu a pergunta diferente.",
    minPlayers: 3,
    maxPlayers: 12,
    route: "/games/perguntas",
    accentColor: DARK_COLORS.warning,
    iconBgColor: DARK_COLORS.warningSoft,
    rulesSummary: [
      "O celular passa de mão em mão: cada jogador confirma que é ele, lê sua pergunta em segredo e registra a resposta no aparelho.",
      "A maioria recebe a mesma pergunta, enquanto um (ou mais) impostor recebe uma pergunta diferente — sem saber que é o impostor.",
      "Depois que todos respondem, todas as respostas são reveladas na tela ao mesmo tempo.",
      "O grupo compara as respostas e vota para descobrir quem recebeu a pergunta diferente.",
    ],
  },
];

export const GAMES_BY_ID: Record<GameId, GameMetadata> = {
  impostor: GAMES[0],
  "cidade-dorme": GAMES[1],
  perguntas: GAMES[2],
};
