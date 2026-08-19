import type { PageServerLoad } from './$types';
import { readPuntuaciones, readUsuarios, getCurrentSeason, migrateFromLegacySheet } from '$lib/server/google';
import { calcularRankings, TOTAL_JORNADAS } from '$lib/types';

export const load: PageServerLoad = async ({ url }) => {
  const temporada = url.searchParams.get('t') || await getCurrentSeason();

  if (!temporada) {
    return { temporada: '', scores: {}, jugadores: [], jornadas: [], clasificacion: [], evolutionData: {}, cumulativeData: {}, positionData: {}, finesData: {}, bestJornada: null, worstJornada: null, maxJornada: 0 };
  }

  let scores = await readPuntuaciones(temporada);
  const usuarios = await readUsuarios();

  if (Object.keys(scores).length === 0) {
    try {
      const result = await migrateFromLegacySheet(temporada);
      if (result.migrated) {
        scores = await readPuntuaciones(temporada);
      }
    } catch {}
  }

  const jugadores = Object.keys(scores);
  const allJornadas = new Set<number>();
  for (const jugador of jugadores) {
    for (const jornada of Object.keys(scores[jugador])) {
      allJornadas.add(Number(jornada));
    }
  }
  const jornadas = Array.from(allJornadas).filter(j => j <= TOTAL_JORNADAS).sort((a, b) => a - b);
  const maxJornada = jornadas.length > 0 ? Math.max(...jornadas) : 0;

  const clasificacion = jugadores.map(jugador => {
    const playerScores = scores[jugador];
    const jornadasPlayed = Object.keys(playerScores).filter(k => Number(k) <= maxJornada).length;
    const totalPuntos = Object.entries(playerScores)
      .filter(([k]) => Number(k) <= maxJornada)
      .reduce((sum, [, v]) => sum + v, 0);

    let totalMulta = 0;
    for (const jornada of jornadas) {
      const jornadaScores: Record<string, number> = {};
      for (const j of jugadores) {
        if (scores[j][jornada] !== undefined) {
          jornadaScores[j] = scores[j][jornada];
        }
      }
      const rankings = calcularRankings(jornadaScores);
      const rank = rankings.find(r => r.jugador === jugador);
      if (rank) totalMulta += rank.multa;
    }

    return {
      jugador,
      photoUrl: usuarios[jugador]?.photoUrl || '',
      totalPuntos,
      totalMulta,
      jornadasPlayed,
      avgPuntos: jornadasPlayed > 0 ? Math.round(totalPuntos / jornadasPlayed * 10) / 10 : 0
    };
  }).sort((a, b) => b.totalPuntos - a.totalPuntos);

  const evolutionData: Record<string, number[]> = {};
  const cumulativeData: Record<string, number[]> = {};
  const positionData: Record<string, (number | null)[]> = {};
  const finesData: Record<string, number[]> = {};

  for (const jugador of jugadores) {
    evolutionData[jugador] = [];
    cumulativeData[jugador] = [];
    positionData[jugador] = [];
    finesData[jugador] = [];

    let cumulative = 0;

    for (const jornada of jornadas) {
      const puntos = scores[jugador][jornada] || 0;
      cumulative += puntos;
      evolutionData[jugador].push(puntos);
      cumulativeData[jugador].push(cumulative);

      const jornadaScores: Record<string, number> = {};
      for (const j of jugadores) {
        if (scores[j][jornada] !== undefined) {
          jornadaScores[j] = scores[j][jornada];
        }
      }
      const rankings = calcularRankings(jornadaScores);
      const rank = rankings.find(r => r.jugador === jugador);
      positionData[jugador].push(rank ? rank.posicion : null);
      finesData[jugador].push(rank ? rank.multa : 0);
    }
  }

  let bestJornada = { jugador: '', puntos: 0, numJornada: 0 };
  let worstJornada = { jugador: '', puntos: Infinity, numJornada: 0 };

  for (const jugador of jugadores) {
    for (const jornada of jornadas) {
      const puntos = scores[jugador][jornada] || 0;
      if (puntos > bestJornada.puntos) {
        bestJornada = { jugador, puntos, numJornada: jornada };
      }
      if (puntos < worstJornada.puntos) {
        worstJornada = { jugador, puntos, numJornada: jornada };
      }
    }
  }

  return {
    temporada,
    clasificacion,
    jornadas,
    jugadores,
    evolutionData,
    cumulativeData,
    positionData,
    finesData,
    bestJornada,
    worstJornada,
    maxJornada
  };
};
