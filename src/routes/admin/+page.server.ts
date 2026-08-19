import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  readPuntuaciones,
  writePuntuaciones,
  addJugadores,
  readUsuarios,
  addUsuario,
  getCurrentSeason,
  getTemporadas,
  createSeason
} from '$lib/server/google';
import { TOTAL_JORNADAS } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const temporada = url.searchParams.get('t') || await getCurrentSeason();
  const temporadas = await getTemporadas();
  const scores = await readPuntuaciones(temporada);
  const usuarios = await readUsuarios();
  const jugadores = Object.keys(scores);

  const allJornadas = new Set<number>();
  for (const jugador of jugadores) {
    for (const jornada of Object.keys(scores[jugador])) {
      allJornadas.add(Number(jornada));
    }
  }
  const jornadas = Array.from(allJornadas).filter(j => j <= TOTAL_JORNADAS).sort((a, b) => a - b);

  return { scores, jugadores, jornadas, usuarios, isAdmin: !!locals.user, temporada, temporadas };
};

export const actions: Actions = {
  updateScores: async ({ request, locals, url }) => {
    if (!locals.user) return fail(403, { error: 'No autorizado' });

    const temporada = url.searchParams.get('t') || await getCurrentSeason();
    const formData = await request.formData();
    const scoresJson = formData.get('scores') as string;

    if (!scoresJson) return fail(400, { error: 'No hay datos para guardar' });

    try {
      const scores = JSON.parse(scoresJson) as Record<string, Record<number, number>>;
      await writePuntuaciones(temporada, scores);
      return { success: true, message: 'Puntuaciones guardadas correctamente' };
    } catch (e) {
      return fail(500, { error: 'Error al guardar: ' + String(e) });
    }
  },

  addJugador: async ({ request, locals, url }) => {
    if (!locals.user) return fail(403, { error: 'No autorizado' });

    const temporada = url.searchParams.get('t') || await getCurrentSeason();
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const displayName = formData.get('displayName') as string;
    const password = formData.get('password') as string;

    if (!nombre) return fail(400, { error: 'Nombre requerido' });

    try {
      await addJugadores(temporada, [nombre]);
      if (displayName || password) {
        await addUsuario(nombre, displayName || nombre, password || '1234');
      }
      return { success: true, message: `Jugador "${nombre}" añadido` };
    } catch (e) {
      return fail(500, { error: 'Error al añadir jugador: ' + String(e) });
    }
  },

  createSeason: async ({ request, locals }) => {
    if (!locals.user) return fail(403, { error: 'No autorizado' });

    const formData = await request.formData();
    const nuevaTemporada = formData.get('nuevaTemporada') as string;

    const match = nuevaTemporada.match(/(\d{2,4})\s*[-/]\s*(\d{2,4})/);
    if (!match) {
      return fail(400, { error: 'Formato de temporada inválido (ej: 25-26, 2025-2026)' });
    }
    const normalized = `${match[1].slice(-2)}-${match[2].slice(-2)}`;

    try {
      await createSeason(normalized);
      return { success: true, message: `Temporada ${normalized} creada` };
    } catch (e) {
      return fail(500, { error: 'Error al crear temporada: ' + String(e) });
    }
  }
};
