import { GAMES_BY_ID } from "@/constants/games";
import { COLORS } from "@/constants/theme";
import {
  CidadeDormeHistoryEntry,
  CidadeDormeMatchState,
  CidadeDormePlayerState,
  CidadeDormeRole,
  CidadeDormeSettings,
  CidadeDormeWinner,
} from "@/types/cidadeDorme";
import { Player } from "@/types/player";
import {
  clampVotingSeconds,
  DEFAULT_VOTING_SECONDS,
  pickRandomElement,
  shuffleArray,
} from "@/utils/gameEngine";

export interface CidadeDormeRoleMeta {
  role: CidadeDormeRole;
  title: string;
  shortDescription: string;
  revealDescription: string;
  accentColor: string;
  softBgColor: string;
  borderColor: string;
  alignment: "assassin" | "innocent";
}

export const CIDADE_DORME_ROLE_META: Record<
  CidadeDormeRole,
  CidadeDormeRoleMeta
> = {
  assassin: {
    role: "assassin",
    title: "Assassino",
    shortDescription: "Escolhe uma vítima à noite sem ser descoberto.",
    revealDescription:
      "À noite, acorde em segredo para escolher uma vítima. Durante o dia, disfarce para não ser eliminado.",
    accentColor: COLORS.danger,
    softBgColor: COLORS.dangerSoft,
    borderColor: "rgba(244, 63, 94, 0.45)",
    alignment: "assassin",
  },
  detective: {
    role: "detective",
    title: "Detetive",
    shortDescription:
      "Investiga um jogador à noite para descobrir sua aliança.",
    revealDescription:
      "À noite, escolha um jogador para investigar e descubra se ele é Inocente ou Assassino.",
    accentColor: "#60A5FA",
    softBgColor: "rgba(96, 165, 250, 0.16)",
    borderColor: "rgba(96, 165, 250, 0.45)",
    alignment: "innocent",
  },
  guardian_angel: {
    role: "guardian_angel",
    title: "Anjo da Guarda",
    shortDescription:
      "Protege um jogador à noite contra o ataque dos assassinos.",
    revealDescription:
      "À noite, escolha uma pessoa para proteger. Se os assassinos escolherem a mesma pessoa, ninguém morre.",
    accentColor: COLORS.success,
    softBgColor: COLORS.successSoft,
    borderColor: "rgba(16, 185, 129, 0.45)",
    alignment: "innocent",
  },
  citizen: {
    role: "citizen",
    title: "Cidadão",
    shortDescription:
      "Não tem poder noturno; ajuda a descobrir os assassinos no debate.",
    revealDescription:
      "Você não possui poderes noturnos. Observe as reações durante o dia e vote para eliminar os assassinos.",
    accentColor: COLORS.primaryText,
    softBgColor: COLORS.primarySoft,
    borderColor: "rgba(167, 139, 250, 0.4)",
    alignment: "innocent",
  },
};

export function getMaxAssassins(playerCount: number): number {
  return Math.max(1, Math.floor(playerCount / 3));
}

export function clampAssassinCount(count: number, playerCount: number): number {
  const maxAssassins = getMaxAssassins(playerCount);
  return Math.min(Math.max(1, Math.round(count)), maxAssassins);
}

export function getMaxSpecialInnocentRole(playerCount: number): number {
  return Math.max(0, Math.ceil(playerCount / 6));
}

export function clampSpecialInnocentCount(
  count: number,
  playerCount: number,
): number {
  const maxCount = getMaxSpecialInnocentRole(playerCount);
  return Math.min(Math.max(0, Math.round(count)), maxCount);
}

/**
 * Clamps and balances Cidade Dorme settings so special roles never exceed playerCount.
 */
export function normalizeCidadeDormeSettings(
  settings: CidadeDormeSettings,
  playerCount: number,
): CidadeDormeSettings {
  const safePlayerCount = Math.max(2, playerCount);
  const assassinCount = clampAssassinCount(
    settings.assassinCount,
    safePlayerCount,
  );
  let detectiveCount = clampSpecialInnocentCount(
    settings.detectiveCount,
    safePlayerCount,
  );
  let guardianAngelCount = clampSpecialInnocentCount(
    settings.guardianAngelCount,
    safePlayerCount,
  );

  let remainingInnocentSlots = Math.max(0, safePlayerCount - assassinCount);
  detectiveCount = Math.min(detectiveCount, remainingInnocentSlots);
  remainingInnocentSlots -= detectiveCount;
  guardianAngelCount = Math.min(guardianAngelCount, remainingInnocentSlots);

  return {
    assassinCount,
    detectiveCount,
    guardianAngelCount,
    votingTimerEnabled: settings.votingTimerEnabled,
    votingDurationSeconds: clampVotingSeconds(settings.votingDurationSeconds),
  };
}

export function getDefaultCidadeDormeSettings(
  playerCount: number,
): CidadeDormeSettings {
  return normalizeCidadeDormeSettings(
    {
      assassinCount: 1,
      detectiveCount: 1,
      guardianAngelCount: 1,
      votingTimerEnabled: true,
      votingDurationSeconds: DEFAULT_VOTING_SECONDS,
    },
    playerCount,
  );
}

export function getCitizenCount(
  settings: CidadeDormeSettings,
  playerCount: number,
): number {
  return Math.max(
    0,
    playerCount -
      settings.assassinCount -
      settings.detectiveCount -
      settings.guardianAngelCount,
  );
}

export function createCidadeDormeMatch(
  players: readonly Player[],
  settings: CidadeDormeSettings,
  matchId: number,
): CidadeDormeMatchState {
  const metadata = GAMES_BY_ID["cidade-dorme"];
  if (
    players.length < metadata.minPlayers ||
    players.length > metadata.maxPlayers
  ) {
    throw new Error(
      `${metadata.title} requer entre ${metadata.minPlayers} e ${metadata.maxPlayers} jogadores.`,
    );
  }

  const normalized = normalizeCidadeDormeSettings(settings, players.length);
  const citizenCount = getCitizenCount(normalized, players.length);

  const rolePool: CidadeDormeRole[] = [
    ...Array<CidadeDormeRole>(normalized.assassinCount).fill("assassin"),
    ...Array<CidadeDormeRole>(normalized.detectiveCount).fill("detective"),
    ...Array<CidadeDormeRole>(normalized.guardianAngelCount).fill(
      "guardian_angel",
    ),
    ...Array<CidadeDormeRole>(citizenCount).fill("citizen"),
  ];

  const shuffledRoles = shuffleArray(rolePool);

  const playerStates: CidadeDormePlayerState[] = players.map(
    (player, index) => ({
      player,
      role: shuffledRoles[index],
      alive: true,
      eliminatedPhase: null,
    }),
  );

  return {
    matchId,
    roundNumber: 1,
    players: playerStates,
    settingsSnapshot: normalized,
    lastNightSummary: null,
    lastEliminatedDayPlayer: null,
    detectiveKnowledge: {},
    history: [],
    winner: null,
  };
}

export function checkCidadeDormeWinner(
  players: readonly CidadeDormePlayerState[],
): CidadeDormeWinner | null {
  const aliveAssassins = players.filter(
    (entry) => entry.alive && entry.role === "assassin",
  ).length;
  const aliveInnocents = players.filter(
    (entry) => entry.alive && entry.role !== "assassin",
  ).length;

  if (aliveAssassins === 0) {
    return "citizens";
  }

  if (aliveAssassins >= aliveInnocents) {
    return "assassins";
  }

  return null;
}

function selectNightVictimId(
  assassinVotes: Record<string, string>,
  validTargetIds: ReadonlySet<string>,
): string | null {
  const voteCounts = new Map<string, number>();

  for (const targetId of Object.values(assassinVotes)) {
    if (!validTargetIds.has(targetId)) continue;
    voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
  }

  if (voteCounts.size === 0) {
    return null;
  }

  let maxVotes = 0;
  let topTargets: string[] = [];

  for (const [targetId, count] of voteCounts.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      topTargets = [targetId];
    } else if (count === maxVotes) {
      topTargets.push(targetId);
    }
  }

  return topTargets.length === 1
    ? topTargets[0]
    : pickRandomElement(topTargets);
}

export function resolveNightActions({
  match,
  assassinVotes,
  guardianTargetIds,
  detectiveInvestigatedIds,
}: {
  match: CidadeDormeMatchState;
  assassinVotes: Record<string, string>;
  guardianTargetIds: readonly string[];
  detectiveInvestigatedIds: readonly string[];
}): CidadeDormeMatchState {
  const validVictimIds = new Set(
    match.players
      .filter((entry) => entry.alive && entry.role !== "assassin")
      .map((entry) => entry.player.id),
  );

  const attackedPlayerId = selectNightVictimId(assassinVotes, validVictimIds);
  const protectedIds = new Set(guardianTargetIds);
  const wasSaved =
    attackedPlayerId !== null && protectedIds.has(attackedPlayerId);

  const killedPlayerId = wasSaved ? null : attackedPlayerId;

  const nextPlayers = match.players.map((entry) =>
    entry.player.id === killedPlayerId
      ? {
          ...entry,
          alive: false,
          eliminatedPhase: { kind: "night" as const, round: match.roundNumber },
        }
      : entry,
  );

  const nextDetectiveKnowledge = { ...match.detectiveKnowledge };
  for (const investigatedId of detectiveInvestigatedIds) {
    const target = match.players.find(
      (entry) => entry.player.id === investigatedId,
    );
    if (target) {
      nextDetectiveKnowledge[investigatedId] =
        target.role === "assassin" ? "assassin" : "innocent";
    }
  }

  const attackedPlayer = match.players.find(
    (entry) => entry.player.id === attackedPlayerId,
  )?.player;

  let historyEntry: CidadeDormeHistoryEntry;
  if (wasSaved && attackedPlayer) {
    historyEntry = {
      id: `night-${match.roundNumber}`,
      cycleNumber: match.roundNumber,
      phase: "night",
      message: `Noite ${match.roundNumber}: ${attackedPlayer.name} foi atacado(a), mas o Anjo da Guarda salvou sua vida.`,
      tone: "success",
    };
  } else if (killedPlayerId && attackedPlayer) {
    historyEntry = {
      id: `night-${match.roundNumber}`,
      cycleNumber: match.roundNumber,
      phase: "night",
      message: `Noite ${match.roundNumber}: ${attackedPlayer.name} foi eliminado(a) pelos assassinos.`,
      tone: "danger",
    };
  } else {
    historyEntry = {
      id: `night-${match.roundNumber}`,
      cycleNumber: match.roundNumber,
      phase: "night",
      message: `Noite ${match.roundNumber}: ninguém foi atacado durante a noite.`,
      tone: "neutral",
    };
  }

  const winner = checkCidadeDormeWinner(nextPlayers);

  return {
    ...match,
    players: nextPlayers,
    lastNightSummary: {
      nightNumber: match.roundNumber,
      attackedPlayerId,
      protectedPlayerId: wasSaved
        ? attackedPlayerId
        : (guardianTargetIds[0] ?? null),
      killedPlayerId,
      wasSaved,
    },
    lastEliminatedDayPlayer: null,
    detectiveKnowledge: nextDetectiveKnowledge,
    history: [...match.history, historyEntry],
    winner,
  };
}

export function resolveDayVote({
  match,
  votedPlayerId,
}: {
  match: CidadeDormeMatchState;
  votedPlayerId: string | null;
}): CidadeDormeMatchState {
  const targetEntry = votedPlayerId
    ? match.players.find(
        (entry) => entry.player.id === votedPlayerId && entry.alive,
      )
    : undefined;

  if (!targetEntry) {
    const historyEntry: CidadeDormeHistoryEntry = {
      id: `day-${match.roundNumber}`,
      cycleNumber: match.roundNumber,
      phase: "day",
      message: `Dia ${match.roundNumber}: ninguém foi eliminado na votação.`,
      tone: "neutral",
    };

    return {
      ...match,
      lastEliminatedDayPlayer: null,
      history: [...match.history, historyEntry],
      winner: checkCidadeDormeWinner(match.players),
    };
  }

  const eliminatedEntry: CidadeDormePlayerState = {
    ...targetEntry,
    alive: false,
    eliminatedPhase: { kind: "day", round: match.roundNumber },
  };

  const nextPlayers = match.players.map((entry) =>
    entry.player.id === eliminatedEntry.player.id ? eliminatedEntry : entry,
  );

  const roleMeta = CIDADE_DORME_ROLE_META[eliminatedEntry.role];
  const historyEntry: CidadeDormeHistoryEntry = {
    id: `day-${match.roundNumber}`,
    cycleNumber: match.roundNumber,
    phase: "day",
    message: `Dia ${match.roundNumber}: ${eliminatedEntry.player.name} foi eliminado(a) (${roleMeta.title}).`,
    tone: eliminatedEntry.role === "assassin" ? "success" : "danger",
  };

  return {
    ...match,
    players: nextPlayers,
    lastEliminatedDayPlayer: eliminatedEntry,
    history: [...match.history, historyEntry],
    winner: checkCidadeDormeWinner(nextPlayers),
  };
}
