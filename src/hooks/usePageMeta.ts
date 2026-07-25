import { useEffect } from 'react';

interface PageMetaInput {
  title: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

function upsertMeta(selector: string, attributes: Record<string, string>, content?: string) {
  if (!content) {
    return;
  }

  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

export function usePageMeta({ title, description, canonical, ogTitle, ogDescription, ogImage }: PageMetaInput) {
  useEffect(() => {
    const previousTitle = document.title;
    const canonicalElement = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonicalElement?.getAttribute('href') ?? null;

    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, ogTitle ?? title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, ogDescription ?? description);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, ogImage);

    const resolvedCanonical = canonical ? new URL(canonical, window.location.origin).toString() : undefined;

    if (resolvedCanonical) {
      const link = canonicalElement ?? document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', resolvedCanonical);

      if (!canonicalElement) {
        document.head.appendChild(link);
      }
    }

    return () => {
      document.title = previousTitle;

      if (canonicalElement) {
        if (previousCanonical) {
          canonicalElement.setAttribute('href', previousCanonical);
        } else {
          canonicalElement.removeAttribute('href');
        }
      }
    };
  }, [canonical, description, ogDescription, ogImage, ogTitle, title]);
}