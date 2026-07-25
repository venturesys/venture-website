/**
 * Resolução dos links que vêm dentro do HTML do WordPress.
 *
 * O conteúdo migrado ainda aponta para o site antigo (`venture.com.br`,
 * `novo.venture.com.br`), para caminhos relativos herdados da estrutura de pastas
 * antiga (`../../publicacoes/...`) e para destinos externos. Sem tratamento, cada
 * um desses links ou tira o visitante do SPA ou cai numa página que não existe mais.
 */

/** Domínios do site (atual e legados) — tudo aqui vira rota interna ou some. */
const INTERNAL_HOSTS = new Set([
  'venture.com.br',
  'www.venture.com.br',
  'novo.venture.com.br',
  'ventureconsultoria.com.br',
  'www.ventureconsultoria.com.br',
]);

/** Primeiro segmento das URLs antigas → seção equivalente no site novo. */
const LEGACY_SECTION_ROUTES: Record<string, string> = {
  publicacoes: '/insights',
  blog: '/insights',
  insights: '/insights',
  cases: '/cases',
  parceiros: '/parceiros',
  parcerias: '/parceiros',
  servicos: '/servicos',
};

/** Páginas antigas de topo que hoje são âncoras da home. */
const LEGACY_HOME_ANCHORS: Record<string, string> = {
  contato: '/#contact',
  empresa: '/#capabilities',
  home: '/',
};

const RESOLUTION_BASE = 'https://www.venture.com.br';

export type ResolvedLink =
  /** Rota do react-router — renderiza como `<Link>`. */
  | { kind: 'internal'; href: string }
  /** Destino fora do site — renderiza como `<a target="_blank">`. */
  | { kind: 'external'; href: string }
  /** Link legado sem equivalente: vira texto puro, para não oferecer um clique morto. */
  | { kind: 'dead' };

/**
 * @param rawHref  href exatamente como veio do WordPress.
 * @param slugIndex mapa slug → rota do SPA (ver `useContentIndex`). Enquanto estiver
 *                  vazio (carregando), links internos ficam como texto em vez de
 *                  apontarem para o lugar errado.
 */
export function resolveContentHref(rawHref: string, slugIndex: ReadonlyMap<string, string>): ResolvedLink {
  const href = rawHref.trim();

  // Âncoras internas do post antigo não sobrevivem à conversão em blocos.
  if (!href || href.startsWith('#')) {
    return { kind: 'dead' };
  }

  if (/^(mailto:|tel:)/i.test(href)) {
    return { kind: 'external', href };
  }

  let url: URL;
  try {
    url = new URL(href, RESOLUTION_BASE);
  } catch {
    return { kind: 'dead' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { kind: 'dead' };
  }

  const isInternalHost = INTERNAL_HOSTS.has(url.hostname.toLowerCase());

  // Um href relativo/absoluto sem domínio é resolvido contra o site antigo, então
  // só é "interno de verdade" se o host bater com um dos domínios conhecidos.
  if (!isInternalHost) {
    return { kind: 'external', href: url.href };
  }

  const segments = url.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { kind: 'internal', href: '/' };
  }

  // O slug real do conteúdo é o último segmento — a hierarquia de categorias do
  // site antigo (/publicacoes/gestao-de-processos/bpm-softexpert/) não existe aqui.
  const slug = decodeURIComponent(segments[segments.length - 1]).toLowerCase();
  const mapped = slugIndex.get(slug);

  if (mapped) {
    return { kind: 'internal', href: mapped };
  }

  const first = segments[0].toLowerCase();

  if (segments.length === 1 && first in LEGACY_HOME_ANCHORS) {
    return { kind: 'internal', href: LEGACY_HOME_ANCHORS[first] };
  }

  if (first in LEGACY_SECTION_ROUTES) {
    return { kind: 'internal', href: LEGACY_SECTION_ROUTES[first] };
  }

  return { kind: 'dead' };
}
