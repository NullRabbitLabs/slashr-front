import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
}

interface Props {
  /** Called with the token on success, or null when it expires/errors. */
  onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile widget. Lazy-loads the script once and renders a single
 * widget. Renders nothing (and never blocks) when no site key is configured -
 * useful for local dev where captcha is disabled.
 */
export function TurnstileWidget({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;

    const render = () => {
      if (!containerRef.current || widgetIdRef.current) return;
      const w = window as unknown as { turnstile?: TurnstileApi };
      if (!w.turnstile) return;
      widgetIdRef.current = w.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };

    if (document.querySelector('script[src*="turnstile"]')) {
      render();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} style={{ marginTop: 16 }} />;
}

/** Whether captcha is enforced in this build. */
export const turnstileEnabled = !!SITE_KEY;
