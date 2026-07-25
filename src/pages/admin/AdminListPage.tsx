import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Trash2, RefreshCw } from 'lucide-react';

import { useAdminSession } from '@/hooks/useAdminSession';
import { fetchIndex, removeItem } from '@/lib/content-repo';
import type { StoredSummary } from '@/lib/content-store';
import { ADMIN_SECTIONS, type AdminSectionKey } from './sections';

export default function AdminListPage({ section }: { section: AdminSectionKey }) {
  const meta = ADMIN_SECTIONS[section];
  const { session } = useAdminSession();
  const [index, setIndex] = useState<StoredSummary[] | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Incrementado para forçar nova leitura depois de publicar ou remover.
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchIndex(session)
      .then((items) => {
        if (!active) return;
        setIndex(items);
        setError(null);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Falha ao ler o repositório.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, recarga]);

  const recarregar = () => {
    setLoading(true);
    setRecarga((n) => n + 1);
  };

  // Momento fixado na montagem: usar Date.now() durante o render deixaria a etiqueta
  // "agendado/publicado" instável entre re-renders.
  const [agora] = useState(() => Date.now());

  const items = useMemo(() => {
    const termo = search.trim().toLowerCase();

    return (index ?? [])
      .filter((item) => item.family === meta.family)
      .filter((item) => !termo || item.title.toLowerCase().includes(termo));
  }, [index, meta.family, search]);

  const handleRemove = async (item: StoredSummary) => {
    if (!session) return;
    if (!window.confirm(`Remover "${item.title}" do site? Isso cria um commit no repositório.`)) {
      return;
    }

    try {
      await removeItem(session, item);
      setAviso('Removido. O site atualiza no próximo deploy.');
      recarregar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover.');
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{meta.plural}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Lendo o repositório…' : `${items.length} ${items.length === 1 ? 'item' : 'itens'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recarregar}
            title="Recarregar do repositório"
            className="rounded-md border border-slate-300 p-2.5 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to={`/admin/${section}/novo`}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Novo {meta.singular.toLowerCase()}
          </Link>
        </div>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por título…"
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm mb-6 outline-none focus:border-slate-900"
      />

      {error ? (
        <p role="alert" className="mb-5 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {aviso ? (
        <p className="mb-5 rounded-md bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{aviso}</p>
      ) : null}

      <div className="border border-slate-200 rounded-md divide-y divide-slate-200">
        {!loading && items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-500 text-center">Nenhum item encontrado.</p>
        ) : null}

        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-4 px-4 py-3">
            <Link
              to={`/admin/${section}/${encodeURIComponent(item.key)}`}
              className="min-w-0 flex-1 text-sm font-medium hover:underline truncate"
            >
              {item.title || '(sem título)'}
            </Link>

            <Estado item={item} agora={agora} />

            <span className="shrink-0 text-xs text-slate-500 w-32 text-right">
              {new Date(item.modified).toLocaleDateString('pt-BR')}
            </span>

            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver no site"
              className="shrink-0 text-slate-400 hover:text-slate-900"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => handleRemove(item)}
              title="Remover do site"
              className="shrink-0 text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Estado({ item, agora }: { item: StoredSummary; agora: number }) {
  if (item.status !== 'publish') {
    return <Etiqueta cor="amber">Rascunho</Etiqueta>;
  }

  if (item.publishAt && new Date(item.publishAt).getTime() > agora) {
    return (
      <Etiqueta cor="sky">
        Agendado {new Date(item.publishAt).toLocaleDateString('pt-BR')}
      </Etiqueta>
    );
  }

  return <Etiqueta cor="emerald">Publicado</Etiqueta>;
}

function Etiqueta({ cor, children }: { cor: 'amber' | 'sky' | 'emerald'; children: React.ReactNode }) {
  const classes = {
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  } as const;

  return <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${classes[cor]}`}>{children}</span>;
}
