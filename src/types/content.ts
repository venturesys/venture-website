/**
 * Tipos do conteúdo do site.
 *
 * Depois da migração o conteúdo vem dos arquivos em `src/content`; os tipos que
 * descreviam as respostas da API do WordPress saíram junto com ela.
 */

export type ContentFamily = 'insight' | 'case' | 'service' | 'partner';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

/** Trecho de texto corrido: o `href` é o valor cru do WordPress, resolvido na renderização. */
export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'link'; value: string; href: string };

export type ContentBlock =
  | {
      type: 'heading' | 'paragraph' | 'quote';
      content: string;
      nodes: InlineNode[];
    }
  | {
      type: 'list';
      items: InlineNode[][];
    }
  | {
      type: 'image';
      src: string;
      alt: string;
    };

export interface ContentSummary {
  id: number;
  slug: string;
  family: ContentFamily;
  title: string;
  description: string;
  image: string;
  href: string;
  eyebrow: string;
  meta?: string;
  tags?: string[];
}

export interface ContentDetail extends ContentSummary {
  excerpt: string;
  blocks: ContentBlock[];
  breadcrumbs: BreadcrumbItem[];
  publishedAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonical?: string;
  ogImage?: string;
}

export interface Insight {
  id: number;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  image: string;
  link: string;
  summary: string;
}

export interface CaseStudy {
  id: number;
  slug: string;
  client: string;
  headline: string;
  body: string;
  image: string;
  link: string;
}

export interface Partner {
  id: number;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  image?: string;
  link: string;
}
