import { useMemo } from 'react';

import { getSummaries, toSummary } from '@/lib/content-store';
import type { ContentFamily, ContentSummary } from '@/types/content';

export function useContentCollection(family: ContentFamily) {
  const items = useMemo<ContentSummary[]>(
    () => getSummaries(family).map(toSummary),
    [family]
  );

  return { items, loading: false, error: null };
}
