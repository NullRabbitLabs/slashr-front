import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'slashr-theme';

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    // Light is the default surface for the redesign; honour an explicit
    // OS dark preference only when the user hasn't chosen.
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export function useTheme() {
  // Start 'light' on BOTH the server and the client's first render so the
  // hydrated markup matches (no mismatch). The blocking script in root.tsx has
  // already stamped `data-theme` on <html>, so the visual surface is correct
  // before paint; we only sync React state (e.g. the toggle icon) on mount.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system preference changes (only if user hasn't explicitly chosen)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
