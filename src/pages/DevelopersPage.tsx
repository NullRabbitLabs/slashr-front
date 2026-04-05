import { useState, useEffect, useRef, useCallback } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useIsMobile } from '@/hooks/useIsMobile';
import { copyToClipboard } from '@/lib/clipboard';
import { generateMcpKey } from '@/api/client';
import type { GenerateKeyError } from '@/api/client';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

const TOOLS = [
  {
    name: 'get_validator_incidents',
    description: 'Get incident history for a validator. Returns delinquency, slashing, and jailing events with timestamps and severity.',
    params: 'address \u00b7 chain \u00b7 days \u00b7 limit',
  },
  {
    name: 'get_validator_stats',
    description: 'Get current performance and staking data for a validator. Chain-specific metrics including delinquency frequency, epoch credits, stake, commission.',
    params: 'address \u00b7 chain',
  },
  {
    name: 'get_scan_results',
    description: 'Get the latest infrastructure scan results for a validator. Shows port states, service health, CVEs, and diagnosis.',
    params: 'address \u00b7 chain',
  },
  {
    name: 'get_worst_offenders',
    description: 'Get validators ranked by incident severity. The \u2018hall of shame\u2019 \u2014 who\u2019s been the most unreliable.',
    params: 'chain \u00b7 period \u00b7 limit',
  },
  {
    name: 'check_delegation',
    description: 'Check the health of a delegator\u2019s staked positions. Paste a wallet address, see which validators they\u2019re staked with and how reliable each one is.',
    params: 'wallet_address \u00b7 chain',
  },
  {
    name: 'get_network_summary',
    description: 'Get a high-level summary of validator incidents across a network. Total events, active incidents, top offenders.',
    params: 'chain \u00b7 period',
  },
];

function getMcpConfig(key: string) {
  return `{
  "mcpServers": {
    "slashr": {
      "url": "https://mcp.slashr.dev/mcp",
      "headers": {
        "Authorization": "Bearer ${key}"
      }
    }
  }
}`;
}

const EXAMPLE_RESPONSE = `Found 3 incident(s) for validator 3dXXxEaV...RjhF on solana (last 7 days):

- [2026-04-04 06:53 UTC] delinquent (warning) - ACTIVE
- [2026-04-03 02:25 UTC] delinquent (warning) - resolved after 1672 min
- [2026-04-01 04:26 UTC] delinquent (warning) - resolved after 2690 min

View on Slashr: https://slashr.dev/validator/solana/3dXXxEaV...RjhF`;

const codeBlock: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-medium)',
  borderRadius: 8,
  padding: '16px 20px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--color-text-primary)',
  overflowX: 'auto',
  whiteSpace: 'pre',
};

const heading: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  letterSpacing: '-0.04em',
  color: 'var(--color-text-primary)',
  margin: 0,
};


export default function DevelopersPage() {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Load Turnstile script and render widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || apiKey) return;

    const renderWidget = () => {
      if (!turnstileRef.current || widgetIdRef.current) return;
      const w = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id: string) => void } };
      if (!w.turnstile) return;
      widgetIdRef.current = w.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback: (token: string) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(null),
      });
    };

    // If script already loaded
    if (document.querySelector('script[src*="turnstile"]')) {
      renderWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [apiKey]);

  const resetTurnstile = useCallback(() => {
    const w = window as unknown as { turnstile?: { reset: (id: string) => void } };
    if (w.turnstile && widgetIdRef.current) {
      w.turnstile.reset(widgetIdRef.current);
      setTurnstileToken(null);
    }
  }, []);

  usePageMeta({
    title: 'Developers \u2014 Slashr',
    description:
      'Integrate validator incident data into your AI agent via MCP. Query delinquency, slashing, infrastructure scans, and delegation health across Solana, Ethereum, Sui, and Cosmos.',
  });

  const mcpConfig = getMcpConfig(apiKey || 'YOUR_API_KEY');

  const copyConfig = () => {
    copyToClipboard(mcpConfig).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyKey = () => {
    if (!apiKey) return;
    copyToClipboard(apiKey).then((ok) => {
      if (!ok) return;
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  };

  const handleGenerate = async () => {
    if (!turnstileToken && TURNSTILE_SITE_KEY) {
      setError('Please complete the verification first.');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await generateMcpKey(turnstileToken || '');
      setApiKey(res.key);
    } catch (e: unknown) {
      const err = e as GenerateKeyError;
      resetTurnstile();
      if (err.status === 429) {
        if (err.message?.includes('one key per IP')) {
          setError("You've already generated a key today. Check your notes if you saved it.");
          setCanRetry(false);
        } else {
          setError('Key generation is temporarily paused. Try again in a few minutes.');
          setCanRetry(true);
        }
      } else if (err.status === 403) {
        setError('Verification failed. Please try again.');
        setCanRetry(true);
      } else if (err.status === 503) {
        setError('Key generation is temporarily unavailable. Please try again later.');
        setCanRetry(true);
      } else {
        setError('Something went wrong. Please try again.');
        setCanRetry(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>

      {/* Hero */}
      <div style={{ marginTop: isMobile ? 24 : 40, marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h1 style={{ ...heading, fontSize: isMobile ? 28 : 36 }}>Build on Slashr</h1>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-accent)',
              background: 'rgba(20, 241, 149, 0.15)',
              border: '1px solid rgba(20, 241, 149, 0.2)',
              borderRadius: 4,
              padding: '2px 8px',
            }}
          >
            MCP
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: isMobile ? 15 : 16,
            lineHeight: 1.6,
            color: 'var(--color-text-secondary)',
            margin: 0,
            maxWidth: 640,
          }}
        >
          Validator incident data for AI agents. Query delinquency, slashing, scan results, and
          delegation health across Solana, Ethereum, Sui, and Cosmos — directly from your agent
          via MCP.
        </p>
      </div>

      {/* Quick start */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ ...heading, fontSize: isMobile ? 18 : 20, marginBottom: 16 }}>Quick start</h2>
        <div style={{ position: 'relative' }}>
          <pre style={codeBlock}>{mcpConfig}</pre>
          <button
            onClick={copyConfig}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-medium)',
              borderRadius: 4,
              padding: '4px 10px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: copied ? 'var(--color-accent)' : 'var(--color-text-dim)',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: 'var(--color-text-dim)',
            marginTop: 10,
          }}
        >
          Transport: Streamable HTTP · Auth: Bearer token · Read-only
        </p>
      </div>

      {/* Tools */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ ...heading, fontSize: isMobile ? 18 : 20, marginBottom: 16 }}>Tools</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TOOLS.map((tool) => (
            <div
              key={tool.name}
              style={{
                padding: '14px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <code
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                  }}
                >
                  {tool.name}
                </code>
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 6,
                }}
              >
                {tool.description}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'var(--color-text-dim)',
                }}
              >
                {tool.params}
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'var(--color-text-dim)',
            marginTop: 12,
          }}
        >
          Chain accepts <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>sol</code>,{' '}
          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>eth</code>,{' '}
          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>sui</code>, or{' '}
          <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>atom</code>.
          Auto-detected from address format when omitted.
        </p>
      </div>

      {/* Example */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ ...heading, fontSize: isMobile ? 18 : 20, marginBottom: 16 }}>Example</h2>
        <pre style={codeBlock}>{EXAMPLE_RESPONSE}</pre>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'var(--color-text-dim)',
            marginTop: 10,
          }}
        >
          Every response includes both human-readable text and structured JSON.
        </p>
      </div>

      {/* Programmatic access */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ ...heading, fontSize: isMobile ? 18 : 20, marginBottom: 16 }}>Programmatic key generation</h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 16,
            maxWidth: 640,
          }}
        >
          Agents that hit the MCP server without a token receive a JSON response explaining how to get one.
          The key generation endpoint is rate-limited to 1 key per IP per day.
        </p>
        <pre style={codeBlock}>{`# Request without auth → server tells you how to get a key
curl -X POST https://mcp.slashr.dev/mcp

{
  "error": "authentication_required",
  "message": "Slashr MCP requires an API key.",
  "get_key": "POST https://mcp.slashr.dev/mcp/keys/generate",
  "docs": "https://slashr.dev/developers"
}

# Generate a key (1 per IP per day, no auth required)
curl -X POST https://mcp.slashr.dev/mcp/keys/generate \\
  -H "Content-Type: application/json" -d '{}'

{
  "key": "slashr_...",
  "docs": "https://slashr.dev/developers",
  "mcp_url": "https://mcp.slashr.dev/mcp"
}

# Use the key
curl -X POST https://mcp.slashr.dev/mcp \\
  -H "Authorization: Bearer slashr_..." \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",...}'`}</pre>
      </div>

      {/* API key generation */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ ...heading, fontSize: isMobile ? 18 : 20, marginBottom: 8 }}>Get your API key</h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            marginBottom: 20,
          }}
        >
          Generate an API key instantly. No account required.
        </p>

        {apiKey ? (
          <div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                marginBottom: 8,
              }}
            >
              Your API key
            </p>
            <div style={{ position: 'relative' }}>
              <pre
                style={{
                  ...codeBlock,
                  padding: '14px 80px 14px 16px',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {apiKey}
              </pre>
              <button
                onClick={copyKey}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-medium)',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: keyCopied ? 'var(--color-accent)' : 'var(--color-text-dim)',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                }}
              >
                {keyCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: 'var(--color-accent)',
                marginTop: 10,
              }}
            >
              Save this key now. It won't be shown again.
            </p>
          </div>
        ) : (
          <div>
            <button
              onClick={handleGenerate}
              disabled={generating || (!canRetry && !!error) || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: isMobile ? '100%' : 'auto',
                padding: '10px 24px',
                background: generating || (!canRetry && !!error) || (!!TURNSTILE_SITE_KEY && !turnstileToken) ? 'var(--color-bg-surface)' : 'var(--color-accent)',
                color: generating || (!canRetry && !!error) || (!!TURNSTILE_SITE_KEY && !turnstileToken) ? 'var(--color-text-dim)' : '#0a0a0b',
                border: 'none',
                borderRadius: 6,
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: generating || (!canRetry && !!error) || (!!TURNSTILE_SITE_KEY && !turnstileToken) ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              {generating ? 'Generating...' : 'Generate API Key'}
            </button>
            {TURNSTILE_SITE_KEY && (
              <div ref={turnstileRef} style={{ marginTop: 16 }} />
            )}
            {error && (
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: 'var(--color-text-dim)',
                  marginTop: 12,
                }}
              >
                {error}
              </p>
            )}
          </div>
        )}

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'var(--color-text-dim)',
            marginTop: 16,
          }}
        >
          Questions? DM{' '}
          <a
            href="https://x.com/SlashrDev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
          >
            @SlashrDev
          </a>{' '}
          on X
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 20,
          paddingBottom: 40,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--color-text-dim)',
        }}
      >
        Slashr tracks validator incidents across 4 networks. Built by{' '}
        <a
          href="https://nullrabbit.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-text-tertiary)', textDecoration: 'none' }}
        >
          NullRabbit
        </a>
        .
      </div>
    </div>
  );
}
