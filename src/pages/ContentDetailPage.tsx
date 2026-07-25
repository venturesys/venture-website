import { Link, useParams } from 'react-router-dom';

import Breadcrumbs from '@/components/content/Breadcrumbs';
import ContentCard from '@/components/content/ContentCard';
import RichContent from '@/components/content/RichContent';
import { useContentCollection } from '@/hooks/useContentCollection';
import { useContentDetail } from '@/hooks/useContentDetail';
import { usePageMeta } from '@/hooks/usePageMeta';
import { familyMeta } from '@/lib/content-meta';
import type { ContentFamily } from '@/types/content';

interface Props {
  family: ContentFamily;
}

export default function ContentDetailPage({ family }: Props) {
  const { slug } = useParams();
  const { item, loading, error } = useContentDetail(family, slug);
  const { items } = useContentCollection(family);
  const meta = familyMeta[family];

  usePageMeta({
    title: item ? `${item.seoTitle ?? item.title} | Venture` : `${meta.singular} | Venture`,
    description: item?.seoDescription ?? meta.listingDescription,
    canonical: item?.canonical,
    ogTitle: item?.seoTitle ?? item?.title,
    ogDescription: item?.seoDescription ?? item?.excerpt,
    ogImage: item?.ogImage,
  });

  if (loading) {
    return (
      <section className="px-[6vw] pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="h-4 w-32 animate-pulse rounded bg-venture-charcoal/40" />
          <div className="h-16 w-2/3 animate-pulse rounded bg-venture-charcoal/40" />
          <div className="aspect-[16/8] animate-pulse rounded bg-venture-charcoal/40" />
          <div className="space-y-4">
            <div className="h-5 w-full animate-pulse rounded bg-venture-charcoal/40" />
            <div className="h-5 w-11/12 animate-pulse rounded bg-venture-charcoal/40" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-venture-charcoal/40" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !item) {
    return (
      <section className="px-[6vw] pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="mx-auto max-w-3xl card-border bg-venture-charcoal/20 p-8 md:p-10">
          <span className="micro-label text-accent block mb-4">{meta.singular}</span>
          <h1 className="headline-lg text-venture-white mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>
            Conteúdo indisponível
          </h1>
          <p className="text-venture-gray text-lg leading-relaxed mb-8">
            Este slug não retornou conteúdo válido do WordPress ou a API está indisponível no momento.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to={meta.routeBase} className="btn-primary">
              Voltar para {meta.plural.toLowerCase()}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center rounded-md border border-white/15 px-6 py-4 text-sm font-medium text-venture-white transition-colors hover:border-accent hover:text-accent"
            >
              Ir para a home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const relatedItems = items.filter((entry) => entry.slug !== item.slug).slice(0, 3);

  return (
    <article className="px-[6vw] pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Breadcrumbs items={item.breadcrumbs} />
        </div>

        <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start mb-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="micro-label text-accent">{item.eyebrow}</span>
              {item.publishedAt ? <span className="text-sm text-venture-gray">{item.publishedAt}</span> : null}
              {item.meta ? <span className="text-sm text-venture-gray">{item.meta}</span> : null}
            </div>

            <h1
              className="headline-lg text-venture-white mb-6 max-w-[14ch] lg:max-w-[10ch] break-words"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 4.25rem)', lineHeight: 0.95 }}
            >
              {item.title}
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-venture-gray leading-relaxed">{item.excerpt}</p>

            {item.tags && item.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="micro-label rounded bg-venture-charcoal/40 px-3 py-2 text-venture-gray">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-sm border border-white/10 bg-venture-charcoal/30 lg:self-start lg:mt-2">
            <img src={item.image} alt={item.title} className="h-full max-h-[28rem] w-full object-cover" />
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          <RichContent blocks={item.blocks} />

          <aside className="space-y-6">
            <div className="card-border bg-venture-charcoal/20 p-6">
              <span className="micro-label text-accent block mb-4">Navegação</span>
              <div className="space-y-3 text-sm">
                <Link to={meta.routeBase} className="block text-venture-white transition-colors hover:text-accent">
                  Ver todos em {meta.plural.toLowerCase()}
                </Link>
                <Link to="/" className="block text-venture-white transition-colors hover:text-accent">
                  Voltar para a home
                </Link>
              </div>
            </div>

            <div className="card-border bg-venture-charcoal/20 p-6 text-sm text-venture-gray space-y-3">
              {item.publishedAt ? <p>Publicado em {item.publishedAt}</p> : null}
              {item.updatedAt ? <p>Atualizado em {item.updatedAt}</p> : null}
            </div>
          </aside>
        </div>

        {relatedItems.length > 0 ? (
          <section className="mt-20">
            <div className="flex items-end justify-between gap-6 mb-8">
              <div>
                <span className="micro-label text-accent block mb-3">Continuar explorando</span>
                <h2 className="font-display text-3xl text-venture-white">Mais em {meta.plural.toLowerCase()}</h2>
              </div>

              <Link to={meta.routeBase} className="text-sm font-medium text-accent transition-colors hover:text-venture-white">
                Ver listagem completa
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedItems.map((related) => (
                <ContentCard key={`${family}-${related.slug}`} item={related} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}