import { useMemo } from 'react';

import { getSlugIndex } from '@/lib/content-store';

/**
 * Mapa slug → rota do site, usado para reescrever os links que o conteúdo migrado
 * ainda traz apontando para o WordPress antigo. Agora vem do índice local, sem rede.
 */
export function useContentIndex(): ReadonlyMap<string, string> {
  return useMemo(() => getSlugIndex(), []);
}
