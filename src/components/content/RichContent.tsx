import { Fragment } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useContentIndex } from '@/hooks/useContentIndex';
import { resolveContentHref } from '@/lib/content-links';
import type { ContentBlock, InlineNode } from '@/types/content';

interface Props {
  blocks: ContentBlock[];
}

const LINK_CLASS =
  'text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-venture-white hover:decoration-venture-white/60';

interface InlineProps {
  nodes: InlineNode[];
  slugIndex: ReadonlyMap<string, string>;
}

function Inline({ nodes, slugIndex }: InlineProps) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'text') {
          return <Fragment key={index}>{node.value}</Fragment>;
        }

        if (node.type === 'strong') {
          return (
            <strong key={index} className="font-semibold text-venture-white">
              {node.value}
            </strong>
          );
        }

        if (node.type === 'em') {
          return <em key={index}>{node.value}</em>;
        }

        const resolved = resolveContentHref(node.href, slugIndex);

        // Link legado sem destino válido: fica como texto, para não dar um clique morto.
        if (resolved.kind === 'dead') {
          return <Fragment key={index}>{node.value}</Fragment>;
        }

        if (resolved.kind === 'internal') {
          return (
            <Link key={index} to={resolved.href} className={LINK_CLASS}>
              {node.value}
            </Link>
          );
        }

        return (
          <a
            key={index}
            href={resolved.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${LINK_CLASS} inline-flex items-baseline gap-1`}
          >
            {node.value}
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 self-center" aria-hidden="true" />
          </a>
        );
      })}
    </>
  );
}

export default function RichContent({ blocks }: Props) {
  const slugIndex = useContentIndex();

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h2 key={`${block.type}-${index}`} className="font-display text-3xl text-venture-white leading-tight">
              <Inline nodes={block.nodes} slugIndex={slugIndex} />
            </h2>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={`${block.type}-${index}`}
              className="border-l border-accent pl-6 text-xl text-venture-white/90 leading-relaxed"
            >
              <Inline nodes={block.nodes} slugIndex={slugIndex} />
            </blockquote>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={`${block.type}-${index}`} className="space-y-3 pl-5 text-venture-gray list-disc marker:text-accent">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">
                  <Inline nodes={item} slugIndex={slugIndex} />
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'image') {
          return (
            <figure key={`${block.type}-${index}`} className="overflow-hidden rounded-sm border border-white/10 bg-venture-charcoal/30">
              <img src={block.src} alt={block.alt} className="w-full object-cover" />
            </figure>
          );
        }

        return (
          <p key={`${block.type}-${index}`} className="text-lg leading-relaxed text-venture-gray">
            <Inline nodes={block.nodes} slugIndex={slugIndex} />
          </p>
        );
      })}
    </div>
  );
}
