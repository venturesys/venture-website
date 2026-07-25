import { useMemo } from 'react';

import { getSummaries, toInsight } from '@/lib/content-store';
import type { Insight } from '@/types/content';

/**
 * O conteúdo vive no repositório, então não há carregamento: `loading` continua no
 * retorno só para os componentes que ainda tratam esse estado (skeletons, refresh do
 * ScrollTrigger) seguirem funcionando sem alteração.
 */
export function useInsights(count = 6) {
  const insights = useMemo<Insight[]>(
    () => getSummaries('insight').slice(0, count).map(toInsight),
    [count]
  );

  return { insights, loading: false, error: null };
}
