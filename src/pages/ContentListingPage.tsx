import { Link } from 'react-router-dom';

import Breadcrumbs from '@/components/content/Breadcrumbs';
import ContentCard from '@/components/content/ContentCard';
import { useContentCollection } from '@/hooks/useContentCollection';
import { usePageMeta } from '@/hooks/usePageMeta';
import { familyMeta } from '@/lib/content-meta';
import type { ContentFamily } from '@/types/content';

interface Props {
  family: ContentFamily;
}

export default function ContentListingPage({ family }: Props) {
  const { items, loading, error } = useContentCollection(family);
  const meta = familyMeta[family];

  usePageMeta({
    title: `${meta.listingTitle} | Venture`,
    description: meta.listingDescription,
    canonical: meta.routeBase,
    ogTitle: `${meta.listingTitle} | Venture`,
    ogDescription: meta.listingDescription,
    ogImage: items[0]?.image,
  });

  return (
    <section className="px-[6vw] pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Início', href: '/' },
              { label: meta.plural, href: meta.routeBase },
            ]}
          />
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-14">
          <div className="max-w-3xl">
            <span className="micro-label text-accent block mb-4">{meta.plural}</span>
            <h1 className="headline-lg text-venture-white mb-5" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
              {meta.listingTitle}
            </h1>
            <p className="text-lg text-venture-gray leading-relaxed">{meta.listingDescription}</p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center rounded-md border border-white/15 px-5 py-3 text-sm font-medium text-venture-white transition-colors hover:border-accent hover:text-accent"
          >
            Voltar para a home
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="card-border overflow-hidden bg-venture-charcoal/20">
                <div className="aspect-[16/10] animate-pulse bg-venture-charcoal/40" />
                <div className="space-y-4 p-6">
                  <div className="h-3 w-24 animate-pulse rounded bg-venture-charcoal/40" />
                  <div className="h-7 w-3/4 animate-pulse rounded bg-venture-charcoal/40" />
                  <div className="h-4 w-full animate-pulse rounded bg-venture-charcoal/40" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-venture-charcoal/40" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="card-border bg-venture-charcoal/20 p-8 text-venture-gray">
            Não foi possível carregar esta listagem agora. Verifique a API do WordPress e tente novamente.
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="card-border bg-venture-charcoal/20 p-8 text-venture-gray">{meta.emptyMessage}</div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={`${family}-${item.slug}`} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}