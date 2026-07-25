/**
 * Gravação de conteúdo no repositório via API do GitHub.
 *
 * Substitui a escrita no WordPress: publicar passa a ser um commit, e o deploy da
 * Vercel entra no ar logo depois. O token é um PAT digitado por quem usa o painel e
 * guardado só na sessão da aba — nunca no repositório nem no bundle.
 *
 * Os commits usam a Git Data API (blob → tree → commit → ref) em vez da Contents API
 * porque cada publicação toca dois arquivos ao mesmo tempo (o item e o índice). Num
 * commit só, ou entram os dois ou não entra nenhum; gravando um de cada vez, uma
 * falha no meio deixaria o índice apontando para um arquivo que não existe.
 */

const API = 'https://api.github.com';

export const CONTENT_INDEX_PATH = 'src/content/index.json';
export const CONTENT_ITEMS_DIR = 'src/content/items';
export const MEDIA_DIR = 'public/media';

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
}

export interface GitHubSession extends RepoConfig {
  token: string;
  /** Login da conta dona do token, confirmado no acesso. */
  login: string;
}

export class GitHubError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GitHubError';
    this.status = status;
  }
}

export interface FileChange {
  path: string;
  /** Texto UTF-8 do arquivo, ou base64 quando `encoding: 'base64'`. */
  content: string;
  encoding?: 'utf-8' | 'base64';
}

async function call<T>(
  session: Pick<GitHubSession, 'token'>,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    throw new GitHubError(await describeError(res), res.status);
  }

  return (await res.json()) as T;
}

async function describeError(res: Response): Promise<string> {
  if (res.status === 401) {
    return 'Token inválido ou expirado.';
  }

  if (res.status === 403) {
    return 'Token sem permissão para esta operação (precisa de acesso de escrita em Contents).';
  }

  if (res.status === 404) {
    return 'Repositório ou branch não encontrado — confira owner, nome e se o token enxerga este repositório.';
  }

  try {
    const body = (await res.json()) as { message?: string };
    return body.message ? `${body.message} (HTTP ${res.status})` : `Erro HTTP ${res.status}`;
  } catch {
    return `Erro HTTP ${res.status}`;
  }
}

/** Valida token + repositório + branch antes de deixar entrar no painel. */
export async function signIn(token: string, config: RepoConfig): Promise<GitHubSession> {
  const user = await call<{ login: string }>({ token }, '/user');

  const repo = await call<{ default_branch: string; permissions?: { push?: boolean } }>(
    { token },
    `/repos/${config.owner}/${config.repo}`
  );

  if (repo.permissions && repo.permissions.push === false) {
    throw new GitHubError('Este token só tem acesso de leitura ao repositório.', 403);
  }

  const branch = config.branch.trim() || repo.default_branch;

  // Confirma que a branch existe — erro aqui é bem mais claro agora do que na hora de publicar.
  await call({ token }, `/repos/${config.owner}/${config.repo}/git/ref/heads/${branch}`);

  return { token, login: user.login, owner: config.owner, repo: config.repo, branch };
}

export async function readFile(session: GitHubSession, path: string): Promise<string | null> {
  const { owner, repo, branch } = session;

  try {
    const data = await call<{ content: string; encoding: string }>(
      session,
      `/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`
    );

    return decodeBase64(data.content);
  } catch (error) {
    if (error instanceof GitHubError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function readJson<T>(session: GitHubSession, path: string): Promise<T | null> {
  const raw = await readFile(session, path);
  return raw === null ? null : (JSON.parse(raw) as T);
}

/**
 * Grava vários arquivos num único commit.
 *
 * @returns o sha do commit criado.
 */
export async function commitFiles(
  session: GitHubSession,
  changes: FileChange[],
  message: string
): Promise<string> {
  const { owner, repo, branch } = session;
  const base = `/repos/${owner}/${repo}`;

  const ref = await call<{ object: { sha: string } }>(
    session,
    `${base}/git/ref/heads/${encodeURIComponent(branch)}`
  );
  const baseCommitSha = ref.object.sha;

  const baseCommit = await call<{ tree: { sha: string } }>(
    session,
    `${base}/git/commits/${baseCommitSha}`
  );

  const blobs = await Promise.all(
    changes.map(async (change) => {
      const blob = await call<{ sha: string }>(session, `${base}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: change.content,
          encoding: change.encoding ?? 'utf-8',
        }),
      });

      return { path: change.path, mode: '100644', type: 'blob', sha: blob.sha };
    })
  );

  const tree = await call<{ sha: string }>(session, `${base}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: blobs }),
  });

  const commit = await call<{ sha: string }>(session, `${base}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [baseCommitSha] }),
  });

  await call(session, `${base}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}

/** Apaga arquivos num único commit, montando a árvore sem eles. */
export async function deleteFiles(
  session: GitHubSession,
  paths: string[],
  extraChanges: FileChange[],
  message: string
): Promise<string> {
  const { owner, repo, branch } = session;
  const base = `/repos/${owner}/${repo}`;

  const ref = await call<{ object: { sha: string } }>(
    session,
    `${base}/git/ref/heads/${encodeURIComponent(branch)}`
  );
  const baseCommitSha = ref.object.sha;

  const baseCommit = await call<{ tree: { sha: string } }>(
    session,
    `${base}/git/commits/${baseCommitSha}`
  );

  const blobs = await Promise.all(
    extraChanges.map(async (change) => {
      const blob = await call<{ sha: string }>(session, `${base}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: change.content, encoding: change.encoding ?? 'utf-8' }),
      });
      return { path: change.path, mode: '100644', type: 'blob', sha: blob.sha };
    })
  );

  // sha nulo numa árvore com base_tree remove o caminho.
  const removals = paths.map((path) => ({ path, mode: '100644', type: 'blob', sha: null }));

  const tree = await call<{ sha: string }>(session, `${base}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: [...blobs, ...removals] }),
  });

  const commit = await call<{ sha: string }>(session, `${base}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [baseCommitSha] }),
  });

  await call(session, `${base}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}

export function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  let binary = '';

  // Em blocos: passar o array inteiro para fromCharCode estoura a pilha em arquivos grandes.
  for (let i = 0; i < buffer.length; i += 8192) {
    binary += String.fromCharCode(...buffer.subarray(i, i + 8192));
  }

  return btoa(binary);
}
