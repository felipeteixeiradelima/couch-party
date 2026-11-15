import { GameId, GameMetadata } from "@/types/game";
import { COLORS } from "./theme";

export const GAMES: GameMetadata[] = [
  {
    id: "impostor",
    title: "Impostor",
    description: "Descubra quem não sabe a palavra secreta.",
    minPlayers: 3,
    maxPlayers: 12,
    route: "/games/impostor",
    accentColor: "#A78BFA",
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
    accentColor: COLORS.warning,
    iconBgColor: COLORS.warningSoft,
    rulesSummary: [
      "A maioria dos jogadores recebe a mesma pergunta secreta.",
      "Um jogador (ou mais) recebe uma pergunta diferente sobre o mesmo tema.",
      "Todos respondem em voz alta ao mesmo tempo ou em sequência.",
      "Pelas respostas dadas, o grupo tenta descobrir quem recebeu a pergunta diferente.",
    ],
  },
];

export const GAMES_BY_ID: Record<GameId, GameMetadata> = {
  impostor: GAMES[0],
  "cidade-dorme": GAMES[1],
  perguntas: GAMES[2],
};
