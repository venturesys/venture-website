/**
 * Operações de conteúdo do painel sobre o repositório.
 *
 * Toda publicação mexe em dois arquivos — o item em `src/content/items/` e o índice
 * `src/content/index.json` — e eles precisam entrar juntos, senão o site tenta abrir
 * um item que não existe. Por isso tudo aqui passa por um commit único.
 */

import {
  CONTENT_INDEX_PATH,
  CONTENT_ITEMS_DIR,
  MEDIA_DIR,
  commitFiles,
  deleteFiles,
  fileToBase64,
  readJson,
  type FileChange,
  type GitHubSession,
} from '@/lib/github';
import type { StoredDetail, StoredSummary } from '@/lib/content-store';
import type { ContentFamily } from '@/types/content';

export type EditableFamily = Extract<ContentFamily, 'insight' | 'case'>;

const ROUTE_BASE: Record<EditableFamily, string> = {
  insight: '/insights',
  case: '/cases',
};

export interface DraftInput {
  family: EditableFamily;
  title: string;
  excerpt: string;
  html: string;
  category: string | null;
  image: string | null;
  status: 'publish' | 'draft';
  publishAt: string | null;
}

export async function fetchIndex(session: GitHubSession): Promise<StoredSummary[]> {
  return (await readJson<StoredSummary[]>(session, CONTENT_INDEX_PATH)) ?? [];
}

export async function fetchItem(
  session: GitHubSession,
  key: string
): Promise<StoredDetail | null> {
  return readJson<StoredDetail>(session, `${CONTENT_ITEMS_DIR}/${key}.json`);
}

export interface SaveResult {
  item: StoredDetail;
  commit: string;
}

export async function saveItem(
  session: GitHubSession,
  draft: DraftInput,
  existing: StoredDetail | null
): Promise<SaveResult> {
  const index = await fetchIndex(session);
  const agora = new Date().toISOString();

  const slug = existing?.slug ?? uniqueSlug(slugify(draft.title), index);
  const id = existing?.id ?? nextId(index);
  const key = existing?.key ?? `${draft.family}--${slug}-${id}`;

  const item: StoredDetail = {
    id,
    slug,
    key,
    family: draft.family,
    href: `${ROUTE_BASE[draft.family]}/${encodeURIComponent(slug)}`,
    title: draft.title,
    excerpt: draft.excerpt,
    image: draft.image,
    category: draft.category,
    readTime: readTime(draft.html),
    date: existing?.date ?? draft.publishAt ?? agora,
    modified: agora,
    categoryIds: existing?.categoryIds ?? [],
    status: draft.status,
    publishAt: draft.publishAt,
    html: draft.html,
    seoTitle: draft.title,
    seoDescription: draft.excerpt,
  };

  // O índice guarda só o resumo: o corpo fica no arquivo do item, para a listagem
  // não carregar o texto de todos os artigos.
  const summary: StoredSummary = {
    id: item.id,
    slug: item.slug,
    key: item.key,
    family: item.family,
    href: item.href,
    title: item.title,
    excerpt: item.excerpt,
    image: item.image,
    category: item.category,
    readTime: item.readTime,
    date: item.date,
    modified: item.modified,
    categoryIds: item.categoryIds,
    status: item.status,
    publishAt: item.publishAt,
  };

  const proximoIndice = [...index.filter((entry) => entry.key !== key), summary].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  const commit = await commitFiles(
    session,
    [
      { path: `${CONTENT_ITEMS_DIR}/${key}.json`, content: `${JSON.stringify(item, null, 2)}\n` },
      { path: CONTENT_INDEX_PATH, content: `${JSON.stringify(proximoIndice, null, 2)}\n` },
    ],
    `${existing ? 'Atualiza' : 'Publica'} ${draft.family === 'case' ? 'case' : 'insight'}: ${draft.title}`
  );

  return { item, commit };
}

export async function removeItem(session: GitHubSession, item: StoredSummary): Promise<string> {
  const index = await fetchIndex(session);
  const proximoIndice = index.filter((entry) => entry.key !== item.key);

  return deleteFiles(
    session,
    [`${CONTENT_ITEMS_DIR}/${item.key}.json`],
    [{ path: CONTENT_INDEX_PATH, content: `${JSON.stringify(proximoIndice, null, 2)}\n` }],
    `Remove ${item.family === 'case' ? 'case' : 'insight'}: ${item.title}`
  );
}

export interface UploadedImage {
  path: string;
  commit: string;
}

export async function uploadImage(
  session: GitHubSession,
  file: File
): Promise<UploadedImage> {
  const nome = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const change: FileChange = {
    path: `${MEDIA_DIR}/${nome}`,
    content: await fileToBase64(file),
    encoding: 'base64',
  };

  const commit = await commitFiles(session, [change], `Adiciona imagem: ${nome}`);

  return { path: `/media/${nome}`, commit };
}

function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'sem-titulo'
  );
}

function uniqueSlug(base: string, index: StoredSummary[]): string {
  if (!index.some((item) => item.slug === base)) {
    return base;
  }

  let n = 2;
  while (index.some((item) => item.slug === `${base}-${n}`)) {
    n += 1;
  }

  return `${base}-${n}`;
}

function nextId(index: StoredSummary[]): number {
  return index.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function readTime(html: string): string {
  const texto = html.replace(/<[^>]*>/g, ' ');
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(palavras / 200))} min`;
}

function sanitizeFileName(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase() || 'imagem.jpg'
  );
}
