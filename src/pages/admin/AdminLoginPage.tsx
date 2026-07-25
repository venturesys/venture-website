import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAdminSession } from '@/hooks/useAdminSession';
import { usePageMeta } from '@/hooks/usePageMeta';

const DEFAULT_OWNER = 'venturesys';
const DEFAULT_REPO = 'venture-website';
const REMEMBER_KEY = 'venture.admin.repo';

export default function AdminLoginPage() {
  const { session, login } = useAdminSession();
  const navigate = useNavigate();

  const lembrado = readRemembered();
  const [owner, setOwner] = useState(lembrado.owner || DEFAULT_OWNER);
  const [repo, setRepo] = useState(lembrado.repo || DEFAULT_REPO);
  const [branch, setBranch] = useState(lembrado.branch || 'main');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  usePageMeta({ title: 'Painel | Venture', description: 'Área restrita.' });

  if (session) {
    return <Navigate to="/admin/insights" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(token.trim(), {
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
      });

      // Guarda só a identificação do repositório; o token nunca sai da sessão.
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ owner: owner.trim(), repo: repo.trim(), branch: branch.trim() || 'main' })
      );

      navigate('/admin/insights', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <img src="/logo-250x60.png" alt="Venture" className="h-9 object-contain invert mb-8" />

        <h1 className="text-2xl font-semibold mb-1">Painel</h1>
        <p className="text-sm text-slate-500 mb-8">
          Publicar aqui grava direto no repositório do site.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="admin-owner">
              Conta
            </label>
            <input
              id="admin-owner"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="admin-repo">
              Repositório
            </label>
            <input
              id="admin-repo"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              required
              placeholder="venture-website"
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <label className="block text-sm font-medium mb-1.5" htmlFor="admin-branch">
          Branch
        </label>
        <input
          id="admin-branch"
          value={branch}
          onChange={(event) => setBranch(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm mb-5 outline-none focus:border-slate-900"
        />

        <label className="block text-sm font-medium mb-1.5" htmlFor="admin-token">
          Token de acesso
        </label>
        <input
          id="admin-token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="off"
          required
          placeholder="github_pat_…"
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
        />
        <p className="mt-2 text-xs text-slate-500">
          Token do GitHub com permissão de escrita em <strong>Contents</strong> neste
          repositório. Fica só nesta aba — fechou o navegador, precisa entrar de novo.
        </p>

        {error ? (
          <p role="alert" className="mt-5 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function readRemembered(): { owner: string; repo: string; branch: string } {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? JSON.parse(raw) : { owner: '', repo: '', branch: '' };
  } catch {
    return { owner: '', repo: '', branch: '' };
  }
}
