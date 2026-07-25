import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';

import { useAdminSession } from '@/hooks/useAdminSession';
import { fetchItem, saveItem, uploadImage, type DraftInput } from '@/lib/content-repo';
import type { StoredDetail } from '@/lib/content-store';
import { ADMIN_SECTIONS, type AdminSectionKey } from './sections';
import { toLocalInputValue, toIsoFromInput } from './dates';
import ContentToolbar from './ContentToolbar';
import { formatarBytes, optimizeImage } from './optimize-image';

export default function AdminEditorPage({ section }: { section: AdminSectionKey }) {
  const meta = ADMIN_SECTIONS[section];
  const { id } = useParams();
  const { session } = useAdminSession();
  const navigate = useNavigate();
  const contentFileRef = useRef<HTMLInputElement>(null);
  const featuredFileRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const isNew = id === 'novo';
  const [item, setItem] = useState<StoredDetail | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [html, setHtml] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'conteudo' | 'destaque' | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'erro'; text: string } | null>(null);

  useEffect(() => {
    if (!session || isNew || !id) return;

    let active = true;

    fetchItem(session, decodeURIComponent(id))
      .then((loaded) => {
        if (!active) return;

        if (!loaded) {
          setMessage({ kind: 'erro', text: 'Item não encontrado no repositório.' });
          return;
        }

        setItem(loaded);
        setTitle(loaded.title);
        setExcerpt(loaded.excerpt);
        setHtml(loaded.html);
        setCategory(loaded.category ?? '');
        setImage(loaded.image);
        setScheduleAt(toLocalInputValue(loaded.publishAt));
      })
      .catch((err) => {
        if (active) setMessage({ kind: 'erro', text: err.message ?? 'Falha ao carregar.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, id, isNew]);

  const save = async (status: 'publish' | 'draft', agendar = false) => {
    if (!session) return;

    if (!title.trim()) {
      setMessage({ kind: 'erro', text: 'O título é obrigatório.' });
      return;
    }

    if (agendar) {
      if (!scheduleAt) {
        setMessage({ kind: 'erro', text: 'Escolha a data e a hora da publicação.' });
        return;
      }
      if (new Date(scheduleAt).getTime() <= Date.now()) {
        setMessage({ kind: 'erro', text: 'A data do agendamento precisa estar no futuro.' });
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    const draft: DraftInput = {
      family: meta.family,
      title: title.trim(),
      excerpt: excerpt.trim(),
      html,
      category: category.trim() || null,
      image,
      status,
      publishAt: agendar ? toIsoFromInput(scheduleAt) : null,
    };

    try {
      const { item: salvo, commit } = await saveItem(session, draft, item);

      setItem(salvo);
      setMessage({
        kind: 'ok',
        text: agendar
          ? `Agendado para ${new Date(salvo.publishAt!).toLocaleString('pt-BR')} · commit ${commit.slice(0, 7)}`
          : status === 'publish'
            ? `Publicado · commit ${commit.slice(0, 7)}. Entra no ar no próximo deploy.`
            : `Rascunho salvo · commit ${commit.slice(0, 7)}`,
      });

      if (isNew) {
        navigate(`/admin/${section}/${encodeURIComponent(salvo.key)}`, { replace: true });
      }
    } catch (err) {
      setMessage({ kind: 'erro', text: err instanceof Error ? err.message : 'Falha ao salvar.' });
    } finally {
      setSaving(false);
    }
  };

  const enviarImagem = async (file: File, destino: 'conteudo' | 'destaque') => {
    if (!session) return;

    setUploading(destino);
    setMessage(null);

    try {
      // Encolhe antes de subir: o que entra aqui é servido direto ao visitante.
      const otimizada = await optimizeImage(file);
      const { path } = await uploadImage(session, otimizada.file);

      const economia =
        otimizada.bytesFinais < otimizada.bytesOriginais
          ? ` (${formatarBytes(otimizada.bytesOriginais)} → ${formatarBytes(otimizada.bytesFinais)})`
          : '';

      if (destino === 'destaque') {
        setImage(path);
        setMessage({ kind: 'ok', text: `Imagem enviada${economia}. Salve para aplicar.` });
      } else {
        const tag = `\n<img src="${path}" alt="" loading="lazy" />\n`;
        const area = contentRef.current;
        const at = area ? area.selectionStart : html.length;
        setHtml((atual) => atual.slice(0, at) + tag + atual.slice(at));
        setMessage({ kind: 'ok', text: `Imagem enviada e inserida no conteúdo${economia}.` });
      }
    } catch (err) {
      setMessage({ kind: 'erro', text: err instanceof Error ? err.message : 'Falha no upload.' });
    } finally {
      setUploading(null);
      if (contentFileRef.current) contentFileRef.current.value = '';
      if (featuredFileRef.current) featuredFileRef.current.value = '';
    }
  };

  if (loading) {
    return <p className="p-8 text-sm text-slate-500">Carregando…</p>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        to={`/admin/${section}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {meta.plural}
      </Link>

      <h1 className="text-2xl font-semibold mb-6">
        {isNew ? `Novo ${meta.singular.toLowerCase()}` : `Editar ${meta.singular.toLowerCase()}`}
      </h1>

      {message ? (
        <p
          role="alert"
          className={`mb-5 rounded-md px-3 py-2.5 text-sm ${
            message.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <label className="block text-sm font-medium mb-1.5" htmlFor="post-title">
        Título
      </label>
      <input
        id="post-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2.5 mb-5 outline-none focus:border-slate-900"
      />

      <label className="block text-sm font-medium mb-1.5" htmlFor="post-excerpt">
        Resumo <span className="font-normal text-slate-500">(aparece nos cards)</span>
      </label>
      <textarea
        id="post-excerpt"
        value={excerpt}
        onChange={(event) => setExcerpt(event.target.value)}
        rows={2}
        className="w-full rounded-md border border-slate-300 px-3 py-2.5 mb-5 outline-none focus:border-slate-900"
      />

      <label className="block text-sm font-medium mb-1.5" htmlFor="post-category">
        Categoria <span className="font-normal text-slate-500">(rótulo do card)</span>
      </label>
      <input
        id="post-category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        list="categorias-sugeridas"
        placeholder="Gestão de Processos"
        className="w-full rounded-md border border-slate-300 px-3 py-2.5 mb-6 outline-none focus:border-slate-900"
      />
      <datalist id="categorias-sugeridas">
        {['Gestão de Processos', 'Gestão da Qualidade', 'Gestão de Riscos', 'Gestão de Documentos'].map(
          (nome) => (
            <option key={nome} value={nome} />
          )
        )}
      </datalist>

      <fieldset className="border border-slate-200 rounded-md p-4 mb-6">
        <legend className="px-1.5 text-sm font-medium">Imagem destacada</legend>
        <p className="text-xs text-slate-500 mb-3">Aparece no card da listagem e no topo do artigo.</p>

        <div className="flex items-start gap-4">
          {image ? (
            <img
              src={image}
              alt="Imagem destacada"
              className="w-40 h-24 rounded border border-slate-200 object-cover"
            />
          ) : (
            <div className="w-40 h-24 rounded border border-dashed border-slate-300 grid place-items-center text-xs text-slate-400">
              sem imagem
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => featuredFileRef.current?.click()}
              disabled={uploading !== null}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              {uploading === 'destaque' ? 'Enviando…' : image ? 'Trocar' : 'Escolher imagem'}
            </button>

            {image ? (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-slate-500 transition-colors hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
                Remover
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={featuredFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) enviarImagem(file, 'destaque');
          }}
        />
      </fieldset>

      <div className="flex items-end justify-between gap-4 mb-1.5">
        <label className="block text-sm font-medium" htmlFor="post-content">
          Conteúdo <span className="font-normal text-slate-500">(HTML)</span>
        </label>

        <button
          type="button"
          onClick={() => contentFileRef.current?.click()}
          disabled={uploading !== null}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          {uploading === 'conteudo' ? 'Enviando…' : 'Inserir imagem'}
        </button>
        <input
          ref={contentFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) enviarImagem(file, 'conteudo');
          }}
        />
      </div>

      <ContentToolbar textareaRef={contentRef} onChange={setHtml} />

      <textarea
        id="post-content"
        ref={contentRef}
        value={html}
        onChange={(event) => setHtml(event.target.value)}
        rows={16}
        className="w-full rounded-b-md border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-slate-900 mb-6"
      />

      <fieldset className="border border-slate-200 rounded-md p-4 mb-6">
        <legend className="px-1.5 text-sm font-medium">Agendamento</legend>
        <p className="text-xs text-slate-500 mb-3">
          O post fica no repositório desde já e aparece no site sozinho na data marcada — sem
          precisar de novo deploy.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(event) => setScheduleAt(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />

          <button
            type="button"
            onClick={() => save('publish', true)}
            disabled={saving || !scheduleAt}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Agendar
          </button>

          {scheduleAt ? (
            <button
              type="button"
              onClick={() => setScheduleAt('')}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Limpar
            </button>
          ) : null}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => save('publish')}
          disabled={saving}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Gravando…' : 'Publicar agora'}
        </button>

        <button
          type="button"
          onClick={() => save('draft')}
          disabled={saving}
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Salvar rascunho
        </button>

        {item ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm text-slate-500 hover:text-slate-900"
          >
            Ver no site
          </a>
        ) : null}
      </div>

      {item ? (
        <p className="mt-4 text-xs text-slate-500">
          {item.status === 'publish' ? 'Publicado' : 'Rascunho'} · slug {item.slug} · arquivo{' '}
          {item.key}.json
        </p>
      ) : null}
    </div>
  );
}
