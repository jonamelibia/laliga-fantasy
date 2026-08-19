import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { readUsuarios, updateUsuario, addUsuario } from '$lib/server/google';

export const load: PageServerLoad = async ({ locals }) => {
  const usuarios = await readUsuarios();
  const userList = Object.entries(usuarios).map(([jugador, data]) => ({
    jugador,
    ...data
  }));

  return { usuarios: userList };
};

export const actions: Actions = {
  updateUsuario: async ({ request, locals }) => {
    if (!locals.user) return fail(403, { error: 'No autorizado' });

    const formData = await request.formData();
    const jugador = formData.get('jugador') as string;
    const displayName = formData.get('displayName') as string;
    const password = formData.get('password') as string;
    const isAdmin = formData.get('isAdmin') === 'on';
    const photoBase64 = formData.get('photoBase64') as string;

    if (!jugador) return fail(400, { error: 'Jugador requerido' });

    try {
      const updates: { displayName?: string; password?: string; isAdmin?: boolean; photoUrl?: string } = {};
      if (displayName) updates.displayName = displayName;
      if (password) updates.password = password;
      updates.isAdmin = isAdmin;
      if (photoBase64 && photoBase64.startsWith('data:image')) {
        if (photoBase64.length > 50000) {
          return fail(400, { error: 'La imagen es demasiado grande' });
        }
        updates.photoUrl = photoBase64;
      }
      await updateUsuario(jugador, updates);
      return { success: true, message: `${displayName || jugador} actualizado` };
    } catch (e) {
      return fail(500, { error: 'Error: ' + String(e) });
    }
  },

  updateUsuarioPhoto: async ({ request, locals }) => {
    if (!locals.user) return fail(403, { error: 'No autorizado' });

    const formData = await request.formData();
    const jugador = formData.get('jugador') as string;
    const photoUrl = formData.get('photoUrl') as string;

    if (!jugador) return fail(400, { error: 'Jugador requerido' });

    try {
      await updateUsuario(jugador, { photoUrl: photoUrl || '' });
      return { success: true, message: 'Foto actualizada' };
    } catch (e) {
      return fail(500, { error: 'Error: ' + String(e) });
    }
  },

  addUsuario: async ({ request, locals }) => {
    if (!locals.user) return fail(403, { error: 'No autorizado' });

    const formData = await request.formData();
    const jugador = formData.get('newJugador') as string;
    const displayName = formData.get('newDisplayName') as string;
    const password = formData.get('newPassword') as string;

    if (!jugador || !password) return fail(400, { error: 'Nombre y contraseña requeridos' });

    try {
      await addUsuario(jugador, displayName || jugador, password);
      return { success: true, message: `${displayName || jugador} creado` };
    } catch (e) {
      return fail(500, { error: 'Error: ' + String(e) });
    }
  }
};
