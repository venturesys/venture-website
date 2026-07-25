/**
 * Conversão do HTML de um artigo para os blocos que a página de conteúdo renderiza.
 *
 * O HTML já vem limpo do script de migração, mas os filtros de chrome continuam aqui
 * como rede de segurança para o conteúdo antigo e para o que for publicado pelo painel.
 */

import type { ContentBlock, InlineNode } from '@/types/content';

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return normalizeWhitespace(doc.body.textContent || '');
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

export function extractContentBlocks(html: string, currentTitle: string): ContentBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const roots = [doc.body];
  const blocks: ContentBlock[] = [];
  const seen = new Set<string>();

  for (const root of roots) {
    const elements = Array.from(
      root.querySelectorAll('h1, h2, h3, h4, p, ul, ol, blockquote, img, div')
    );

    for (const element of elements) {
      if (shouldIgnoreElement(element)) {
        continue;
      }

      if (element.tagName === 'DIV' && !isBareLinkContainer(element)) {
        continue;
      }

      if (element.tagName === 'IMG') {
        const src = element.getAttribute('src');
        if (!src) {
          continue;
        }

        const key = `image:${src}`;
        if (seen.has(key)) {
          continue;
        }

        blocks.push({
          type: 'image',
          src,
          alt: normalizeWhitespace(element.getAttribute('alt') || currentTitle),
        });
        seen.add(key);
        continue;
      }

      if (element.tagName === 'UL' || element.tagName === 'OL') {
        const items = Array.from(element.querySelectorAll(':scope > li'))
          .map((item) => extractInlineNodes(item))
          .filter((nodes) => nodes.length > 0);

        if (items.length === 0) {
          continue;
        }

        const key = `list:${items.map(inlineText).join('|')}`;
        if (seen.has(key)) {
          continue;
        }

        blocks.push({ type: 'list', items });
        seen.add(key);
        continue;
      }

      const nodes = extractInlineNodes(element);
      const content = inlineText(nodes);
      if (!content || content === currentTitle || seen.has(content) || isNoiseBlock(content, nodes)) {
        continue;
      }

      if (/^h[1-4]$/i.test(element.tagName)) {
        blocks.push({ type: 'heading', content, nodes });
      } else if (element.tagName === 'BLOCKQUOTE') {
        blocks.push({ type: 'quote', content, nodes });
      } else {
        blocks.push({ type: 'paragraph', content, nodes });
      }

      seen.add(content);
    }
  }

  if (blocks.length > 0) {
    return blocks;
  }

  const fallback = stripHtml(html)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map(
      (content) =>
        ({ type: 'paragraph', content, nodes: [{ type: 'text', value: content }] }) as ContentBlock
    );

  return fallback;
}

const EMPHASIS_TAGS: Record<string, 'strong' | 'em'> = {
  STRONG: 'strong',
  B: 'strong',
  EM: 'em',
  I: 'em',
};

/**
 * Converte um elemento em texto + links + ênfase, preservando a ordem. Sem isso os
 * `<a>` do WordPress são achatados em texto e o leitor fica com um "clique aqui" morto.
 */
function extractInlineNodes(element: Element): InlineNode[] {
  const nodes: InlineNode[] = [];

  const pushText = (value: string) => {
    const text = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
    if (!text) {
      return;
    }

    const last = nodes[nodes.length - 1];
    if (last?.type === 'text') {
      last.value += text;
      return;
    }

    nodes.push({ type: 'text', value: text });
  };

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        pushText(child.textContent || '');
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const el = child as Element;

      if (el.tagName === 'BR') {
        pushText(' ');
        continue;
      }

      if (el.tagName === 'A') {
        const href = el.getAttribute('href');
        const label = normalizeWhitespace(el.textContent || '');

        if (href && label) {
          nodes.push({ type: 'link', value: label, href });
        } else {
          // Âncora sem rótulo (envolvendo uma imagem, por exemplo): mantém o miolo.
          walk(el);
        }
        continue;
      }

      // Ênfase só vira nó própria quando não embrulha um link: o link é a informação
      // mais importante do trecho e o modelo de nós é plano, sem aninhamento.
      const emphasis = EMPHASIS_TAGS[el.tagName];
      if (emphasis && !el.querySelector('a[href]')) {
        const label = normalizeWhitespace(el.textContent || '');
        if (label) {
          nodes.push({ type: emphasis, value: label });
          continue;
        }
      }

      walk(el);
    }
  };

  walk(element);

  const first = nodes[0];
  if (first?.type === 'text') {
    first.value = first.value.replace(/^\s+/, '');
  }

  const last = nodes[nodes.length - 1];
  if (last?.type === 'text') {
    last.value = last.value.replace(/\s+$/, '');
  }

  return nodes.filter((node) => node.type !== 'text' || node.value.length > 0);
}

function inlineText(nodes: InlineNode[]): string {
  return normalizeWhitespace(nodes.map((node) => node.value).join(''));
}

/**
 * O WordPress publica alguns CTAs como um `<div style="text-align:center">` contendo
 * só o `<a>`, sem `<p>` em volta. Sem isso o link some do artigo. O filtro aceita
 * apenas divs-folha com link — qualquer div que contenha outro bloco é ignorada,
 * senão o mesmo texto voltaria repetido a cada nível de aninhamento.
 */
function isBareLinkContainer(element: Element): boolean {
  return (
    element.querySelector('a[href]') !== null &&
    element.querySelector(
      'div, p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, img, table, section, article, form'
    ) === null
  );
}

function shouldIgnoreElement(element: Element): boolean {
  return Boolean(
    element.closest(
      [
        '#dslc-header',
        '.dslc-navigation',
        '.dslc-mobile-navigation',
        '.menu',
        '.sub-menu',
        '.essgrid',
        '.esg-grid',
        'nav',
        'header',
        'footer',
        'script',
        'style',
        'form',
        'select',
      ].join(', ')
    )
  );
}

/** Restos do layout do site antigo que às vezes escapam de `shouldIgnoreElement`. */
const CHROME_PHRASES = ['home empresa serviços', 'cases publicações parcerias contato'];

/** CTA padrão do site antigo, repetido em parceiros e serviços. */
const LEGACY_CTA = 'clique aqui e conheça mais';

/**
 * Filtro do corpo do artigo. O CTA legado só é descartado quando ficou sem link: com
 * destino válido ele é justamente o que o leitor procura na página do parceiro ou do
 * serviço.
 */
function isNoiseBlock(content: string, nodes: InlineNode[]): boolean {
  const lowered = content.toLowerCase();

  if (CHROME_PHRASES.some((phrase) => lowered.includes(phrase)) || lowered.startsWith('[ess_grid')) {
    return true;
  }

  return lowered.includes(LEGACY_CTA) && !nodes.some((node) => node.type === 'link');
}
