import { useMemo } from 'react';

import { getSummaries, toPartner } from '@/lib/content-store';
import type { Partner } from '@/types/content';

export function usePartners() {
  const partners = useMemo<Partner[]>(() => getSummaries('partner').map(toPartner), []);

  return { partners, loading: false, error: null };
}
