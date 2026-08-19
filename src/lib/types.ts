export interface PlayerScores {
  jugador: string;
  scores: Record<number, number>;
}

export interface JornadaData {
  num_jornada: number;
  scores: Record<string, number>;
}

export interface StandingsRow {
  jugador: string;
  photoUrl: string;
  totalPuntos: number;
  totalMulta: number;
  jornadasPlayed: number;
  avgPuntos: number;
}

export interface UserProfile {
  jugador: string;
  displayName: string;
  photoUrl: string;
  password: string;
  isAdmin: boolean;
}

export interface JornadaRanking {
  num_jornada: number;
  rankings: {
    jugador: string;
    puntos: number;
    posicion: number;
    multa: number;
  }[];
}

export const TOTAL_JORNADAS = 38;

export const PLAYER_COLORS: Record<string, string> = {};

export const DEFAULT_COLORS = [
  '#E30613',
  '#FFD700',
  '#1E90FF',
  '#32CD32',
  '#FF69B4',
  '#FF4500',
  '#00CED1',
  '#FF8C00'
];

export function calcularMulta(posicion: number): number {
  if (posicion <= 3) return 0;
  return posicion - 3;
}

export function calcularRankings(scores: Record<string, number>): { jugador: string; puntos: number; posicion: number; multa: number }[] {
  const entries = Object.entries(scores).map(([jugador, puntos]) => ({ jugador, puntos }));
  entries.sort((a, b) => b.puntos - a.puntos);

  const allZero = entries.every(e => e.puntos === 0);

  const ranked: { jugador: string; puntos: number; posicion: number; multa: number }[] = [];

  for (let i = 0; i < entries.length; i++) {
    ranked.push({
      jugador: entries[i].jugador,
      puntos: entries[i].puntos,
      posicion: 0,
      multa: 0
    });
  }

  if (allZero) {
    let pos = 1;
    for (let i = 0; i < ranked.length; i++) {
      ranked[i].posicion = pos++;
    }
    return ranked;
  }

  let pos = 1;
  let i = 0;
  while (i < ranked.length) {
    let j = i;
    while (j < ranked.length && ranked[j].puntos === ranked[i].puntos) j++;
    const worstOrdinal = j;
    const multa = worstOrdinal <= 3 ? 0 : worstOrdinal - 3;
    for (let k = i; k < j; k++) {
      ranked[k].posicion = pos;
      ranked[k].multa = multa;
    }
    pos = j + 1;
    i = j;
  }

  return ranked;
}
