/**
 * Metadados editoriais do site: nomes das seções, rotas e os ajustes que o conteúdo
 * migrado não carrega sozinho (nome do cliente em cada case, tags de cada parceiro,
 * ordem dos serviços em destaque).
 *
 * Não depende de WordPress — é o que sobra de "regra do site" depois da migração.
 */

import type { ContentFamily } from '@/types/content';

export const serviceHighlights = [
  {
    id: 'estrategia',
    slug: 'estrategia-sustentabilidade-riscos',
    label: 'ESTRATÉGIA',
    title: 'Estratégia e Sustentabilidade, com visão de longo prazo.',
  },
  {
    id: 'digital',
    slug: 'transformacao-digital-processos',
    label: 'TRANSFORMAÇÃO',
    title: 'Transformação Digital com uso de tecnologias inovadoras.',
  },
  {
    id: 'perf',
    slug: 'performance-tecnologia-rpa',
    label: 'PERFORMANCE',
    title: 'Performance e Tecnologia em automação e TI.',
  },
  {
    id: 'projetos',
    slug: 'gestao-de-processos-em-projetos',
    label: 'PROJETOS',
    title: 'Gestão em Projetos de Capital, controlando riscos e prazos.',
  },
] as const;

export const serviceHighlightMap: Record<
  string,
  { id: string; slug: string; label: string; title: string; order: number }
> = Object.fromEntries(serviceHighlights.map((item, index) => [item.slug, { ...item, order: index }]));

export const caseClientMap: Record<string, string> = {
  'como-fazer-mais-com-menos': 'Vale',
  'como-integrar-os-processos-do-projeto': 'Anglo American',
  'estrategia-corporativa': 'SWM',
};

export const partnerTagsMap: Record<string, string[]> = {
  'softexpert-2': ['GESTÃO', 'CONFORMIDADE', 'EXCELÊNCIA'],
  'biti9-rpa': ['RPA', 'AUTOMAÇÃO', 'IA'],
};

export const familyMeta: Record<
  ContentFamily,
  {
    singular: string;
    plural: string;
    routeBase: string;
    listingTitle: string;
    listingDescription: string;
    emptyMessage: string;
  }
> = {
  insight: {
    singular: 'Insight',
    plural: 'Insights',
    routeBase: '/insights',
    listingTitle: 'Insights e publicações',
    listingDescription: 'Análises, relatórios e tendências publicadas pela Venture.',
    emptyMessage: 'Nenhum insight encontrado no momento.',
  },
  case: {
    singular: 'Case',
    plural: 'Cases',
    routeBase: '/cases',
    listingTitle: 'Cases de transformação operacional',
    listingDescription: 'Projetos e resultados entregues com foco em eficiência, governança e escala.',
    emptyMessage: 'Nenhum case encontrado no momento.',
  },
  service: {
    singular: 'Serviço',
    plural: 'Serviços',
    routeBase: '/servicos',
    listingTitle: 'Serviços Venture',
    listingDescription: 'Frentes de atuação que conectam estratégia, processos, risco e tecnologia.',
    emptyMessage: 'Nenhum serviço encontrado no momento.',
  },
  partner: {
    singular: 'Parceiro',
    plural: 'Parcerias',
    routeBase: '/parceiros',
    listingTitle: 'Parcerias estratégicas',
    listingDescription: 'Ecossistema de parceiros que amplia a capacidade de execução da Venture.',
    emptyMessage: 'Nenhum parceiro encontrado no momento.',
  },
};

export function getContentPath(family: ContentFamily, slug?: string): string {
  const base = familyMeta[family].routeBase;
  return slug ? `${base}/${encodeURIComponent(slug)}` : base;
}
