/**
 * Migração one-off: WordPress → arquivos do repositório.
 *
 * Baixa todo o conteúdo publicado em venture.com.br, limpa o HTML do construtor de
 * páginas antigo, traz as imagens para `public/media/` e reescreve os caminhos. Depois
 * disso o site não precisa mais falar com o WordPress em tempo de execução.
 *
 *   node scripts/migrate-wp.mjs [--dry]
 *
 * É idempotente: rodar de novo sobrescreve a saída com o estado atual do WordPress.
 */

import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'node-html-parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src/content');
const ITEMS_DIR = path.join(CONTENT_DIR, 'items');
const MEDIA_DIR = path.join(ROOT, 'public/media');

const WP = 'https://venture.com.br/wp-json/wp/v2';
const DRY = process.argv.includes('--dry');

const CATEGORY_IDS = { insights: 33, cases: 34, partners: 39 };
const SERVICE_PARENT_ID = 1717;

const FAMILIES = [
  {
    family: 'insight',
    routeBase: '/insights',
    // Mesma regra do site: insight é todo post que não é case nem parceiro.
    endpoint: `/posts?categories_exclude=${CATEGORY_IDS.cases},${CATEGORY_IDS.partners}`,
  },
  { family: 'case', routeBase: '/cases', endpoint: `/posts?categories=${CATEGORY_IDS.cases}` },
  {
    family: 'partner',
    routeBase: '/parceiros',
    endpoint: `/posts?categories=${CATEGORY_IDS.partners}`,
  },
  { family: 'service', routeBase: '/servicos', endpoint: `/pages?parent=${SERVICE_PARENT_ID}` },
];

/** Blocos do layout antigo que nunca fazem parte do artigo. */
const CHROME_SELECTORS = [
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
  'noscript',
  'form',
  'select',
  'iframe',
];

const CHROME_PHRASES = ['home empresa serviços', 'cases publicações parcerias contato'];

const stats = {
  itens: 0,
  imagensBaixadas: 0,
  imagensJaExistentes: 0,
  imagensFalhadas: [],
  htmlVazio: [],
};

const mediaCache = new Map();

async function main() {
  console.log(DRY ? '— simulação (--dry), nada será escrito —\n' : '— migrando —\n');

  if (!DRY) {
    await rm(CONTENT_DIR, { recursive: true, force: true });
    await mkdir(ITEMS_DIR, { recursive: true });
    await mkdir(MEDIA_DIR, { recursive: true });
  }

  const summaries = [];

  for (const family of FAMILIES) {
    const items = await fetchAll(family.endpoint);
    console.log(`${family.family}: ${items.length} itens`);

    for (const raw of items) {
      const item = await convert(raw, family);
      summaries.push(item.summary);
      stats.itens += 1;

      if (!DRY) {
        await writeFile(
          path.join(ITEMS_DIR, `${item.summary.key}.json`),
          JSON.stringify(item.detail, null, 2),
          'utf8'
        );
      }
    }
  }

  summaries.sort((a, b) => (a.date < b.date ? 1 : -1));

  if (!DRY) {
    await writeFile(
      path.join(CONTENT_DIR, 'index.json'),
      JSON.stringify(summaries, null, 2),
      'utf8'
    );
  }

  report(summaries);
}

async function fetchAll(endpoint) {
  const joiner = endpoint.includes('?') ? '&' : '?';
  const all = [];

  for (let page = 1; page <= 10; page += 1) {
    const url = `${WP}${endpoint}${joiner}_embed&per_page=100&page=${page}`;
    const res = await fetch(url);

    if (res.status === 400) break; // além da última página
    if (!res.ok) throw new Error(`${res.status} em ${url}`);

    const batch = await res.json();
    all.push(...batch);

    const total = Number(res.headers.get('X-WP-TotalPages') ?? 1);
    if (page >= total) break;
  }

  return all;
}

async function convert(raw, { family, routeBase }) {
  const title = decodeEntities(stripTags(raw.title?.rendered ?? ''));
  const slug = decodeURIComponent(raw.slug);
  const html = await cleanHtml(raw.content?.rendered ?? '', `${family}/${slug}`);

  if (!html.trim()) {
    stats.htmlVazio.push(`${family}/${slug}`);
  }

  const featured = raw._embedded?.['wp:featuredmedia']?.[0];
  const featuredRemote =
    featured?.media_details?.sizes?.large?.source_url ??
    featured?.media_details?.sizes?.full?.source_url ??
    featured?.source_url ??
    raw.yoast_head_json?.og_image?.[0]?.url ??
    firstImageOf(html);

  const image = featuredRemote ? await localizeImage(featuredRemote, `${family}/${slug}`) : null;
  const terms = (raw._embedded?.['wp:term'] ?? []).flat().filter(Boolean);
  const category =
    terms.find((term) => term.id !== CATEGORY_IDS.insights && term.id !== 1)?.name ?? null;

  const summary = {
    id: raw.id,
    slug,
    family,
    // O slug pode conter caracteres não-ASCII (há um post com emoji): o href vai
    // percent-encoded para funcionar como URL, e o `slug` decodificado é o que a
    // rota compara depois que o react-router decodifica o parâmetro.
    href: `${routeBase}/${encodeURIComponent(slug)}`,
    title,
    excerpt: resolveExcerpt(raw, html),
    image,
    category,
    readTime: readTime(html),
    date: raw.date,
    modified: raw.modified,
    categoryIds: raw.categories ?? [],
    // Tudo que veio do WordPress já estava no ar.
    status: 'publish',
    publishAt: null,
    /** Nome do arquivo em `items/` — ASCII, para não depender de emoji no sistema de arquivos. */
    key: `${family}--${sanitize(slug).toLowerCase() || raw.id}-${raw.id}`,
  };

  const detail = {
    ...summary,
    html,
    seoTitle: raw.yoast_head_json?.title ?? title,
    seoDescription: raw.yoast_head_json?.description ?? summary.excerpt,
  };

  return { summary, detail };
}

/** Remove o chrome do construtor de páginas e devolve só o corpo do artigo. */
async function cleanHtml(rendered, contexto) {
  if (!rendered.trim()) return '';

  const doc = parse(rendered, { blockTextElements: { script: false, style: false } });

  for (const selector of CHROME_SELECTORS) {
    doc.querySelectorAll(selector).forEach((node) => node.remove());
  }

  const root =
    doc.querySelector('.dslc-tp-content #dslc-theme-content-inner') ??
    doc.querySelector('.dslc-text-module-content') ??
    doc.querySelector('article, main, .entry-content') ??
    doc;

  // Parágrafos que sobraram do menu antigo.
  root.querySelectorAll('p, div').forEach((node) => {
    const text = node.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (CHROME_PHRASES.some((phrase) => text.includes(phrase))) {
      node.remove();
    }
  });

  for (const img of root.querySelectorAll('img[src]')) {
    const local = await localizeImage(img.getAttribute('src'), contexto);

    if (local) {
      img.setAttribute('src', local);
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.setAttribute('loading', 'lazy');
      continue;
    }

    // A origem já estava fora do ar antes da migração; manter a URL só renderiza um
    // ícone de imagem quebrada. Some daqui e entra no relatório para ser reposta.
    img.remove();
  }

  return collapseBlankLines(root.innerHTML);
}

/**
 * Baixa a imagem para `public/media/` e devolve o caminho local.
 *
 * O nome recebe um hash curto da URL de origem: há arquivos com o mesmo nome em
 * domínios diferentes, e parte das imagens vive em `novo.venture.com.br` e em um
 * domínio de terceiro — trazer tudo para cá é justamente o ponto da migração.
 */
async function localizeImage(remote, contexto) {
  if (!remote || remote.startsWith('data:')) return remote ?? null;
  if (mediaCache.has(remote)) return mediaCache.get(remote);

  let url;
  try {
    url = new URL(remote, 'https://venture.com.br');
  } catch {
    mediaCache.set(remote, null);
    return null;
  }

  const hash = createHash('sha1').update(url.href).digest('hex').slice(0, 8);
  const base = sanitize(decodeURIComponent(path.basename(url.pathname))) || 'imagem';
  const ext = path.extname(base) || '.jpg';
  const name = `${path.basename(base, ext)}-${hash}${ext}`.toLowerCase();
  const local = `/media/${name}`;

  if (DRY) {
    mediaCache.set(remote, local);
    stats.imagensBaixadas += 1;
    return local;
  }

  try {
    const res = await fetch(url.href, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) throw new Error('arquivo vazio');

    await writeFile(path.join(MEDIA_DIR, name), buffer);
    stats.imagensBaixadas += 1;
    mediaCache.set(remote, local);
    return local;
  } catch (error) {
    stats.imagensFalhadas.push({ url: url.href, motivo: error.message, contexto });
    mediaCache.set(remote, null);
    return null;
  }
}

/**
 * O excerpt automático do WordPress é gerado a partir do HTML inteiro da página,
 * então vem com o menu do site antigo grudado na frente. Só serve quando não parece
 * chrome; senão, cai para a descrição de SEO ou para o primeiro parágrafo real.
 */
function resolveExcerpt(raw, html) {
  const candidatos = [
    raw.yoast_head_json?.description,
    decodeEntities(stripTags(raw.excerpt?.rendered ?? '')),
  ];

  for (const candidato of candidatos) {
    const texto = (candidato ?? '').trim();
    if (texto && !pareceChrome(texto)) {
      return texto;
    }
  }

  const primeiroParagrafo = parse(html)
    .querySelectorAll('p')
    .map((node) => decodeEntities(node.textContent.replace(/\s+/g, ' ').trim()))
    .find((texto) => texto.length > 40 && !pareceChrome(texto));

  return primeiroParagrafo ?? '';
}

function pareceChrome(texto) {
  const lower = texto.toLowerCase();
  return CHROME_PHRASES.some((frase) => lower.includes(frase)) || lower.startsWith('[ess_grid');
}

function firstImageOf(html) {
  return parse(html).querySelector('img[src]')?.getAttribute('src') ?? null;
}

function readTime(html) {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function stripTags(value) {
  return parse(value).textContent.replace(/ /g, ' ').replace(/\s+/g, ' ');
}

function decodeEntities(value) {
  return value
    .replace(/&#8217;|&#039;|&apos;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function collapseBlankLines(html) {
  return html.replace(/\n{3,}/g, '\n\n').trim();
}

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

function report(summaries) {
  const porFamilia = summaries.reduce((acc, item) => {
    acc[item.family] = (acc[item.family] ?? 0) + 1;
    return acc;
  }, {});

  console.log('\n— resultado —');
  console.table(porFamilia);
  console.log(`itens:              ${stats.itens}`);
  console.log(`imagens baixadas:   ${stats.imagensBaixadas}`);

  if (stats.htmlVazio.length) {
    console.log(`\n⚠ ${stats.htmlVazio.length} itens sem corpo:`);
    stats.htmlVazio.forEach((slug) => console.log(`   ${slug}`));
  }

  if (stats.imagensFalhadas.length) {
    // A origem dessas imagens já estava fora do ar antes da migração; foram removidas
    // do corpo do artigo para não deixar ícone quebrado. Precisam ser repostas à mão.
    const porArtigo = stats.imagensFalhadas.reduce((acc, item) => {
      (acc[item.contexto] ??= []).push(item);
      return acc;
    }, {});

    console.log(
      `\n⚠ ${stats.imagensFalhadas.length} imagens estavam fora do ar na origem e foram removidas.`
    );
    console.log('  Artigos que perderam imagem e precisam de reposição:');
    for (const [artigo, itens] of Object.entries(porArtigo)) {
      console.log(`   ${artigo}  (${itens.length})`);
      itens.forEach(({ url, motivo }) => console.log(`      ${motivo}  ${url}`));
    }
  }

  const semImagem = summaries.filter((item) => !item.image);
  if (semImagem.length) {
    console.log(`\n⚠ ${semImagem.length} itens sem imagem de destaque:`);
    semImagem.forEach((item) => console.log(`   ${item.family}/${item.slug}`));
  }
}

main().catch((error) => {
  console.error('\nfalhou:', error);
  process.exit(1);
});
