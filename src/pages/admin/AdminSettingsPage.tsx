import { useEffect, useState } from 'react';

import { useAdminSession } from '@/hooks/useAdminSession';
import { fetchIndex } from '@/lib/content-repo';
import type { StoredSummary } from '@/lib/content-store';

export default function AdminSettingsPage() {
  const { session } = useAdminSession();
  const [index, setIndex] = useState<StoredSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fixado na montagem para o render não depender do relógio.
  const [agora] = useState(() => Date.now());

  useEffect(() => {
    if (!session) return;

    let active = true;
    fetchIndex(session)
      .then((items) => active && setIndex(items))
      .catch((err) => active && setError(err.message ?? 'Falha ao ler o repositório.'));

    return () => {
      active = false;
    };
  }, [session]);

  const contagem = (familia: string) => (index ?? []).filter((i) => i.family === familia).length;
  const rascunhos = (index ?? []).filter((i) => i.status !== 'publish').length;
  const agendados = (index ?? []).filter(
    (i) => i.status === 'publish' && i.publishAt && new Date(i.publishAt).getTime() > agora
  ).length;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Configurações</h1>

      <section className="border border-slate-200 rounded-md p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Onde o conteúdo é gravado</h2>
        <dl className="text-sm space-y-1.5">
          <Linha rotulo="Conta" valor={session?.login} />
          <Linha rotulo="Repositório" valor={`${session?.owner}/${session?.repo}`} />
          <Linha rotulo="Branch" valor={session?.branch} />
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          Publicar grava um commit. O site entra no ar quando a Vercel terminar o deploy desse
          commit — normalmente um a dois minutos. Para revogar o acesso, apague o token nas
          configurações de Developer settings do GitHub.
        </p>
      </section>

      <section className="border border-slate-200 rounded-md p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Conteúdo no repositório</h2>

        {error ? <p className="text-sm text-red-700 mb-3">{error}</p> : null}

        {index ? (
          <dl className="text-sm space-y-1.5">
            <Linha rotulo="Insights" valor={String(contagem('insight'))} />
            <Linha rotulo="Cases" valor={String(contagem('case'))} />
            <Linha rotulo="Parceiros" valor={String(contagem('partner'))} />
            <Linha rotulo="Serviços" valor={String(contagem('service'))} />
            <Linha rotulo="Rascunhos" valor={String(rascunhos)} />
            <Linha rotulo="Agendados" valor={String(agendados)} />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Lendo…</p>
        )}
      </section>

      <section className="border border-slate-200 rounded-md p-5">
        <h2 className="text-sm font-semibold mb-3">Como o site organiza o conteúdo</h2>
        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
          <li>
            Cada item é um arquivo em <code className="text-xs">src/content/items/</code>, e o
            índice <code className="text-xs">src/content/index.json</code> alimenta as listagens.
          </li>
          <li>
            <strong>Rascunho</strong> fica no repositório mas não aparece no site.
          </li>
          <li>
            <strong>Agendado</strong> aparece sozinho quando a data chega — a verificação é feita
            no navegador de quem visita, então não precisa de novo deploy.
          </li>
          <li>Parceiros e serviços ainda são editados direto nos arquivos.</li>
        </ul>
      </section>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-500 w-32 shrink-0">{rotulo}</dt>
      <dd className="min-w-0 truncate">{valor ?? '—'}</dd>
    </div>
  );
}
