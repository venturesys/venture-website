import { useEffect, useReducer } from 'react';

import { extractContentBlocks } from '@/lib/content-blocks';
import { loadDetail, toDetail } from '@/lib/content-store';
import type { ContentDetail, ContentFamily } from '@/types/content';

/**
 * O corpo de cada item vive num chunk próprio, carregado sob demanda — por isso o
 * estado assíncrono continua aqui, mesmo sem rede envolvida.
 */
export function useContentDetail(family: ContentFamily, slug?: string) {
  const [state, dispatch] = useReducer(detailReducer, initialDetailState);

  useEffect(() => {
    if (!slug) {
      dispatch({ type: 'reset' });
      return;
    }

    let active = true;

    loadDetail(family, slug)
      .then((stored) => {
        if (!active) return;

        dispatch({
          type: 'success',
          item: stored ? toDetail(stored, extractContentBlocks(stored.html, stored.title)) : null,
        });
      })
      .catch((error) => {
        if (active) {
          dispatch({ type: 'error', error: error as Error });
        }
      });

    return () => {
      active = false;
    };
  }, [family, slug]);

  return state;
}

interface DetailState {
  item: ContentDetail | null;
  loading: boolean;
  error: Error | null;
}

type DetailAction =
  | { type: 'success'; item: ContentDetail | null }
  | { type: 'error'; error: Error }
  | { type: 'reset' };

const initialDetailState: DetailState = {
  item: null,
  loading: true,
  error: null,
};

function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    case 'success':
      return { item: action.item, loading: false, error: null };
    case 'error':
      return { ...state, loading: false, error: action.error };
    case 'reset':
      return { item: null, loading: false, error: null };
    default:
      return state;
  }
}
