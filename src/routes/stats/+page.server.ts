import type { PageServerLoad } from './$types';
import { readUsuarios, getTemporadas } from '$lib/server/google';

export const load: PageServerLoad = async () => {
  const usuarios = await readUsuarios();
  const temporadas = await getTemporadas();

  const players = Object.entries(usuarios).map(([jugador, u]) => ({
    jugador,
    displayName: u.displayName,
    photoUrl: u.photoUrl
  }));

  return {
    players,
    totalSeasons: temporadas.length
  };
};
