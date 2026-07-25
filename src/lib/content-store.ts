/**
 * Fonte de conteúdo do site: arquivos do próprio repositório.
 *
 * Substitui as chamadas em tempo de execução ao WordPress. O índice (resumos) entra
 * no bundle porque é pequeno e todas as listagens precisam dele; o corpo de cada item
 * fica num chunk separado, carregado só quando o artigo é aberto.
 *
 * Os arquivos são gerados por `scripts/migrate-wp.mjs` — não edite à mão.
 */

import indexJson from '@/content/index.json';
import {
  caseClientMap,
  familyMeta,
  partnerTagsMap,
  serviceHighlightMap,
} from '@/lib/content-meta';
import type {
  CaseStudy,
  ContentDetail,
  ContentFamily,
  ContentSummary,
  Insight,
  Partner,
} from '@/types/content';

export interface StoredSummary {
  id: number;
  slug: string;
  family: ContentFamily;
  href: string;
  title: string;
  excerpt: string;
  image: string | null;
  category: string | null;
  readTime: string;
  date: string;
  modified: string;
  categoryIds: number[];
  status: 'publish' | 'draft';
  /** Data ISO a partir da qual o item aparece; `null` = imediato. */
  publishAt: string | null;
  key: string;
}

export interface StoredDetail extends StoredSummary {
  html: string;
  seoTitle: string;
  seoDescription: string;
}

const SUMMARIES = indexJson as StoredSummary[];

const DETAIL_LOADERS = import.meta.glob<{ default: StoredDetail }>('@/content/items/*.json');

const FALLBACK_IMAGE: Record<ContentFamily, string> = {
  insight: '/insights_01.jpg',
  case: '/case_vale.jpg',
  partner: '/logo-250x60.png',
  service: '/hero_portrait.jpg',
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/**
 * Rascunho nunca aparece; agendado só depois da data marcada.
 *
 * A checagem é feita na hora da leitura, não na build: assim um post agendado entra
 * no ar sozinho quando a data chega, sem precisar de um novo deploy.
 */
export function isLive(item: StoredSummary): boolean {
  if (item.status !== 'publish') {
    return false;
  }

  return !item.publishAt || new Date(item.publishAt).getTime() <= Date.now();
}

export function getSummaries(family: ContentFamily): StoredSummary[] {
  const items = SUMMARIES.filter((item) => item.family === family && isLive(item));

  if (family !== 'service') {
    return items;
  }

  // Serviços seguem a ordem editorial dos destaques, não a data.
  return items
    .filter((item) => item.slug in serviceHighlightMap)
    .sort((left, right) => serviceHighlightMap[left.slug].order - serviceHighlightMap[right.slug].order);
}

/** Todos os serviços, inclusive os que não são destaque na home. */
export function getAllServiceSummaries(): StoredSummary[] {
  return SUMMARIES.filter((item) => item.family === 'service');
}

export function findSummary(family: ContentFamily, slug: string): StoredSummary | undefined {
  return SUMMARIES.find((item) => item.family === family && item.slug === slug && isLive(item));
}

export async function loadDetail(
  family: ContentFamily,
  slug: string
): Promise<StoredDetail | null> {
  const summary = findSummary(family, slug);
  if (!summary) {
    return null;
  }

  const entry = Object.entries(DETAIL_LOADERS).find(([path]) =>
    path.endsWith(`/${summary.key}.json`)
  );

  if (!entry) {
    return null;
  }

  const loaded = await entry[1]();
  return loaded.default;
}

/** Mapa slug → rota, usado para reescrever links legados dentro dos artigos. */
export function getSlugIndex(): ReadonlyMap<string, string> {
  const index = new Map<string, string>();

  for (const item of SUMMARIES.filter(isLive)) {
    const key = item.slug.toLowerCase();
    if (!index.has(key)) {
      index.set(key, item.href);
    }
  }

  return index;
}

export function imageOf(item: StoredSummary): string {
  return item.image ?? FALLBACK_IMAGE[item.family];
}

export function toInsight(item: StoredSummary): Insight {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    category: item.category ?? 'Artigo',
    readTime: item.readTime,
    image: imageOf(item),
    link: item.href,
    summary: item.excerpt,
  };
}

export function toCase(item: StoredSummary): CaseStudy {
  return {
    id: item.id,
    slug: item.slug,
    client: caseClientMap[item.slug] ?? item.title,
    headline: item.title,
    body: item.excerpt,
    image: imageOf(item),
    link: item.href,
  };
}

export function toPartner(item: StoredSummary): Partner {
  return {
    id: item.id,
    slug: item.slug,
    name: item.title,
    description: item.excerpt,
    tags: partnerTagsMap[item.slug] ?? [],
    image: imageOf(item),
    link: item.href,
  };
}

export function toSummary(item: StoredSummary): ContentSummary {
  const base = {
    id: item.id,
    slug: item.slug,
    family: item.family,
    title: item.title,
    description: item.excerpt,
    image: imageOf(item),
    href: item.href,
  };

  if (item.family === 'case') {
    return { ...base, title: caseClientMap[item.slug] ?? item.title, eyebrow: 'Case', meta: formatDate(item.modified) };
  }

  if (item.family === 'partner') {
    const tags = partnerTagsMap[item.slug] ?? [];
    return { ...base, eyebrow: 'Parceiro', meta: tags.slice(0, 2).join(' • '), tags };
  }

  if (item.family === 'service') {
    const highlight = serviceHighlightMap[item.slug];
    return {
      ...base,
      description: highlight?.title ?? item.excerpt,
      eyebrow: highlight?.label ?? 'Serviço',
      meta: formatDate(item.modified),
    };
  }

  return { ...base, eyebrow: item.category ?? 'Artigo', meta: item.readTime };
}

export function toDetail(item: StoredDetail, blocks: ContentDetail['blocks']): ContentDetail {
  const summary = toSummary(item);

  return {
    ...summary,
    excerpt: item.excerpt,
    blocks,
    breadcrumbs: [
      { label: 'Início', href: '/' },
      { label: familyMeta[item.family].plural, href: familyMeta[item.family].routeBase },
      { label: summary.title, href: item.href },
    ],
    publishedAt: formatDate(item.date),
    updatedAt: formatDate(item.modified),
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonical: item.href,
    ogImage: imageOf(item),
  };
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : dateFormatter.format(date);
}
