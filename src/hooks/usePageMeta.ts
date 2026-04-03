import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMeta {
  title: string;
  description: string;
}

const BASE_URL = 'https://slashr.dev';
const DEFAULT_TITLE = 'slashr \u2014 live validator incident feed';
const DEFAULT_DESCRIPTION =
  'Real-time slashing, delinquency, and missed vote tracking across Solana, Ethereum, Sui, and Cosmos.';

function setMetaContent(selector: string, content: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', content);
}

export function usePageMeta({ title, description }: PageMeta) {
  const { pathname } = useLocation();
  const url = `${BASE_URL}${pathname}`;

  useEffect(() => {
    document.title = title;
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', url);
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);

    return () => {
      document.title = DEFAULT_TITLE;
      setMetaContent('meta[property="og:title"]', DEFAULT_TITLE);
      setMetaContent('meta[property="og:description"]', DEFAULT_DESCRIPTION);
      setMetaContent('meta[property="og:url"]', BASE_URL);
      setMetaContent('meta[name="description"]', DEFAULT_DESCRIPTION);
      setMetaContent('meta[name="twitter:title"]', DEFAULT_TITLE);
      setMetaContent('meta[name="twitter:description"]', DEFAULT_DESCRIPTION);
    };
  }, [title, description, url]);
}
