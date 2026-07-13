import { useEffect } from 'react';

// Injects a page-level JSON-LD <script> into <head> on mount and removes it on
// unmount. Complements the sitewide Organization/WebSite graph in index.html
// with per-page structured data (e.g. Dataset) for JS-rendering crawlers.
export function useJsonLd(data: object | null) {
  const json = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!json) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-page-jsonld', '');
    script.textContent = json;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [json]);
}
