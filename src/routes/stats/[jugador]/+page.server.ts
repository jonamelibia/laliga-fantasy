import type { PageServerLoad } from './$types';
import { readPuntuaciones, readUsuarios, getTemporadas } from '$lib/server/google';
import { calcularRankings, TOTAL_JORNADAS } from '$lib/types';

export const load: PageServerLoad = async ({ params }) => {
  const jugador = decodeURIComponent(params.jugador);
  const temporadas = await getTemporadas();
  const usuarios = await readUsuarios();
  const user = usuarios[jugador];

  const seasonStats: {
    temporada: string;
    totalPuntos: number;
    totalMulta: number;
    jornadasPlayed: number;
    avgPuntos: number;
    bestJornada: { num: number; puntos: number };
    worstJornada: { num: number; puntos: number };
    bestPosition: number;
    rankings: { numJornada: number; posicion: number; puntos: number; multa: number }[];
    scores: Record<number, number>;
  }[] = [];

  for (const temporada of temporadas) {
    const scores = await readPuntuaciones(temporada);
    if (!scores[jugador]) continue;

    const playerScores = scores[jugador];
    const jugadores = Object.keys(scores);
    const allJornadas = new Set<number>();
    for (const j of jugadores) {
      for (const num of Object.keys(scores[j])) {
        allJornadas.add(Number(num));
      }
    }
    const jornadas = Array.from(allJornadas).filter(j => j <= TOTAL_JORNADAS).sort((a, b) => a - b);

    let totalPuntos = 0;
    let totalMulta = 0;
    let bestJornada = { num: 0, puntos: 0 };
    let worstJornada = { num: 0, puntos: Infinity };
    let bestPosition = Infinity;
    const rankings: { numJornada: number; posicion: number; puntos: number; multa: number }[] = [];

    for (const jornada of jornadas) {
      const puntos = playerScores[jornada] || 0;
      totalPuntos += puntos;

      if (puntos > bestJornada.puntos) bestJornada = { num: jornada, puntos };
      if (puntos < worstJornada.puntos && puntos > 0) worstJornada = { num: jornada, puntos };

      const jornadaScores: Record<string, number> = {};
      for (const j of jugadores) {
        if (scores[j][jornada] !== undefined) jornadaScores[j] = scores[j][jornada];
      }
      const ranking = calcularRankings(jornadaScores);
      const myRank = ranking.find(r => r.jugador === jugador);
      if (myRank) {
        totalMulta += myRank.multa;
        rankings.push({ numJornada: jornada, posicion: myRank.posicion, puntos, multa: myRank.multa });
        if (myRank.posicion < bestPosition) bestPosition = myRank.posicion;
      }
    }

    const jornadasPlayed = rankings.length;
    seasonStats.push({
      temporada,
      totalPuntos,
      totalMulta,
      jornadasPlayed,
      avgPuntos: jornadasPlayed > 0 ? Math.round(totalPuntos / jornadasPlayed * 10) / 10 : 0,
      bestJornada,
      worstJornada: worstJornada.puntos === Infinity ? { num: 0, puntos: 0 } : worstJornada,
      bestPosition: bestPosition === Infinity ? 0 : bestPosition,
      rankings,
      scores: playerScores
    });
  }

  return {
    jugador,
    profile: user ? { displayName: user.displayName, photoUrl: user.photoUrl } : null,
    seasonStats,
    totalSeasons: seasonStats.length
  };
};
