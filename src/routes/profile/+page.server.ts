import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { readUsuarios, updateUsuario } from '$lib/server/google';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      profile: {
        jugador: '',
        displayName: '',
        photoUrl: ''
      }
    };
  }

  const usuarios = await readUsuarios();
  const user = usuarios[locals.user.jugador];

  return {
    profile: {
      jugador: locals.user.jugador,
      displayName: user?.displayName || locals.user.jugador,
      photoUrl: user?.photoUrl || ''
    }
  };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'No autorizado' });

    const formData = await request.formData();
    const displayName = formData.get('displayName') as string;
    const password = formData.get('password') as string;

    try {
      const updates: { displayName?: string; password?: string } = {};
      if (displayName) updates.displayName = displayName;
      if (password) updates.password = password;

      await updateUsuario(locals.user.jugador, updates);
      return { success: true, message: 'Perfil actualizado' };
    } catch (e) {
      return fail(500, { error: 'Error al actualizar: ' + String(e) });
    }
  },

  uploadPhoto: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'No autorizado' });

    const formData = await request.formData();
    const photoBase64 = formData.get('photoBase64') as string;
    const photo = formData.get('photo') as File;

    if (photoBase64 && photoBase64.startsWith('data:image')) {
      if (photoBase64.length > 50000) {
        return fail(400, { error: 'La imagen procesada sigue siendo demasiado grande, prueba con otra' });
      }
      try {
        await updateUsuario(locals.user.jugador, { photoUrl: photoBase64 });
        return { success: true, message: 'Foto actualizada', photoUrl: photoBase64 };
      } catch (e) {
        return fail(500, { error: 'Error al guardar foto: ' + String(e) });
      }
    }

    if (!photo || photo.size === 0) {
      return fail(400, { error: 'Selecciona una imagen' });
    }

    if (photo.size > 2 * 1024 * 1024) {
      return fail(400, { error: 'La imagen no puede superar 2MB' });
    }

    try {
      const buffer = await photo.arrayBuffer();
      const base64 = `data:${photo.type};base64,${Buffer.from(buffer).toString('base64')}`;
      if (base64.length > 50000) {
        return fail(400, { error: 'La imagen es demasiado grande para almacenar, prueba con una más pequeña' });
      }
      await updateUsuario(locals.user.jugador, { photoUrl: base64 });
      return { success: true, message: 'Foto actualizada', photoUrl: base64 };
    } catch (e) {
      return fail(500, { error: 'Error al subir foto: ' + String(e) });
    }
  },

  deletePhoto: async ({ locals }) => {
    if (!locals.user) return fail(401, { error: 'No autorizado' });

    try {
      await updateUsuario(locals.user.jugador, { photoUrl: '' });
      return { success: true, message: 'Foto eliminada', photoUrl: '' };
    } catch (e) {
      return fail(500, { error: 'Error al eliminar foto: ' + String(e) });
    }
  }
};
