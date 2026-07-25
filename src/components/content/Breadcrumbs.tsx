import { Link } from 'react-router-dom';

import type { BreadcrumbItem } from '@/types/content';

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-venture-gray">
      {items.map((item, index) => (
        <span key={`${item.href}-${item.label}`} className="flex items-center gap-2">
          {index > 0 ? <span className="text-venture-gray/40">/</span> : null}
          {index === items.length - 1 ? (
            <span className="text-venture-white">{item.label}</span>
          ) : (
            <Link to={item.href} className="hover:text-venture-white transition-colors">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}