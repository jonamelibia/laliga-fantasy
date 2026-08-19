import type { Handle } from '@sveltejs/kit';
import { readUsuarios } from '$lib/server/google';

const PROTECTED_PREFIXES = ['/admin', '/profile'];

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const sessionCookie = event.cookies.get('session');

  // Parse session if exists
  if (sessionCookie) {
    try {
      const parts = sessionCookie.split(':');
      const jugador = parts[0];
      const token = parts[1];
      
      if (jugador && token) {
        const usuarios = await readUsuarios();
        const user = usuarios[jugador];
        
        if (user) {
          event.locals.user = {
            jugador,
            displayName: user.displayName,
            photoUrl: user.photoUrl,
            isAdmin: true
          };
        }
      }
    } catch {}
  }

  // Enforce login for protected routes
  const needsAuth = PROTECTED_PREFIXES.some(p => path.startsWith(p));
  if (needsAuth && !event.locals.user) {
    const returnTo = encodeURIComponent(path + event.url.search);
    return new Response(null, {
      status: 302,
      headers: { location: `/?needLogin=1&returnTo=${returnTo}` }
    });
  }

  return resolve(event);
};
