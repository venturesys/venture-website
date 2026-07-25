import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ContentSummary } from '@/types/content';

interface Props {
  item: ContentSummary;
}

export default function ContentCard({ item }: Props) {
  return (
    <Link
      to={item.href}
      className="group card-border bg-venture-charcoal/30 backdrop-blur-sm overflow-hidden transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[16/10] overflow-hidden bg-venture-charcoal/40">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="micro-label text-accent">{item.eyebrow}</span>
          {item.meta ? <span className="text-xs text-venture-gray">{item.meta}</span> : null}
        </div>

        <h3 className="font-display text-2xl text-venture-white mb-3 leading-tight group-hover:text-accent transition-colors">
          {item.title}
        </h3>

        <p className="text-venture-gray leading-relaxed mb-5">{item.description}</p>

        {item.tags && item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-5">
            {item.tags.map((tag) => (
              <span key={tag} className="micro-label rounded bg-venture-black/60 px-2 py-1 text-venture-gray">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="inline-flex items-center gap-2 text-sm font-medium text-accent group-hover:text-venture-white transition-colors">
          <span>Ver conteúdo</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}