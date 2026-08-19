import type { LayoutServerLoad } from './$types';
import { getCurrentSeason, getTemporadas } from '$lib/server/google';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const temporada = url.searchParams.get('t') || await getCurrentSeason();
  const temporadas = await getTemporadas();

  return {
    user: locals.user || null,
    temporada,
    temporadas
  };
};
