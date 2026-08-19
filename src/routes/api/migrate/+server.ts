import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { migrateFromLegacySheet } from '$lib/server/google';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user?.isAdmin) {
    return json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetSeason = body.season || '25-26';
    const result = await migrateFromLegacySheet(targetSeason);
    return json({ success: true, ...result });
  } catch (e) {
    return json({ error: 'Error en la migración: ' + String(e) }, { status: 500 });
  }
};
