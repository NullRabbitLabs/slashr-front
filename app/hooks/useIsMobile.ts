import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 640px)';

export function useIsMobile(): boolean {
  // SSR-safe: `window` is undefined on the server, so default to desktop and
  // correct after hydration in the effect below.
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
