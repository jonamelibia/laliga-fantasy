import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateUsuario } from '$lib/server/google';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;

    if (!photo || photo.size === 0) {
      return json({ error: 'No hay imagen' }, { status: 400 });
    }

    if (photo.size > 2 * 1024 * 1024) {
      return json({ error: 'Imagen demasiado grande (max 2MB)' }, { status: 400 });
    }

    const buffer = await photo.arrayBuffer();
    const base64 = `data:${photo.type};base64,${Buffer.from(buffer).toString('base64')}`;
    await updateUsuario(locals.user.jugador, { photoUrl: base64 });

    return json({ success: true, url: base64 });
  } catch (e) {
    return json({ error: 'Error al subir: ' + String(e) }, { status: 500 });
  }
};
