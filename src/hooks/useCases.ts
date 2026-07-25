import { useMemo } from 'react';

import { findSummary, toCase } from '@/lib/content-store';

const VALE_SLUG = 'como-fazer-mais-com-menos';
const ANGLO_SLUG = 'como-integrar-os-processos-do-projeto';

export function useCases() {
  return useMemo(() => {
    const vale = findSummary('case', VALE_SLUG);
    const anglo = findSummary('case', ANGLO_SLUG);

    return {
      vale: vale ? toCase(vale) : null,
      anglo: anglo ? toCase(anglo) : null,
      loading: false,
      error: null,
    };
  }, []);
}
