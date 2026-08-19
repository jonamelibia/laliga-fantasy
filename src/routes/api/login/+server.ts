import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readUsuarios, seedDefaultUsers, getCurrentSeason } from '$lib/server/google';

const ADMIN_PASSWORD = 'diocleciano';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const formData = await request.formData();
  const jugador = formData.get('jugador') as string;
  const password = formData.get('password') as string;

  if (!jugador || !password) {
    return json({ error: 'Selecciona jugador y contraseña' }, { status: 400 });
  }

  try {
    let usuarios = await readUsuarios();

    if (Object.keys(usuarios).length === 0) {
      await seedDefaultUsers();
      usuarios = await readUsuarios();
    }

    const user = usuarios[jugador];

    if (!user) {
      return json({ error: `Jugador "${jugador}" no encontrado` }, { status: 400 });
    }

    const isAdmin = password === ADMIN_PASSWORD || user.isAdmin;
    const isPasswordValid = password === ADMIN_PASSWORD || user.password === password;

    if (!isPasswordValid) {
      return json({ error: 'Contraseña incorrecta' }, { status: 400 });
    }

    const token = crypto.randomUUID();
    const cookieValue = `${jugador}:${token}:${isAdmin ? '1' : '0'}`;

    cookies.set('session', cookieValue, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 24 * 30
    });

    return json({ success: true });
  } catch (e) {
    return json({ error: 'Error al conectar con el servidor' }, { status: 500 });
  }
};
