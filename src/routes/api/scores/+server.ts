import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readPuntuaciones, writePuntuaciones, getCurrentSeason } from '$lib/server/google';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const temporada = url.searchParams.get('t') || await getCurrentSeason();
    const scores = await readPuntuaciones(temporada);
    return json({ success: true, temporada, data: scores });
  } catch (e) {
    return json({ error: 'Error al leer puntuaciones: ' + String(e) }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
  if (!locals.user?.isAdmin) {
    return json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const temporada = url.searchParams.get('t') || await getCurrentSeason();
    const body = await request.json();
    const { scores } = body;

    if (!scores || typeof scores !== 'object') {
      return json({ error: 'Datos inválidos' }, { status: 400 });
    }

    await writePuntuaciones(temporada, scores);
    return json({ success: true });
  } catch (e) {
    return json({ error: 'Error al guardar: ' + String(e) }, { status: 500 });
  }
};
