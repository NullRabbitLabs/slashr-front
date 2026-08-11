import { useState } from 'react';
import { Link } from 'react-router';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNetworks } from '@/hooks/useNetworks';
import { copyToClipboard } from '@/lib/clipboard';

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
  const { networks } = useNetworks();
  const [copied, setCopied] = useState(false);

  usePageMeta({
    title: 'Developers \u2014 Slashr',
    description:
      'Integrate validator incident data into your AI agent via MCP. Query delinquency, slashing, infrastructure scans, and delegation health across every network we track.',
  });

  const mcpConfig = getMcpConfig('YOUR_API_KEY');

  const copyConfig = () => {
    copyToClipboard(mcpConfig).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
          Connect your AI agent to live validator incident data via the{' '}
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--color-border-medium)' }}
          >
            Model Context Protocol
          </a>
          . Query delinquency, slashing, scan results, and
          delegation health across every network we track.
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
  "get_key": "Sign in at https://slashr.dev/account to create an API key",
  "docs": "https://slashr.dev/developers"
}

# Create a key: sign in at https://slashr.dev/account (one-time display).
# Then use the key

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
          API &amp; MCP keys are tied to your account. Create and manage them from your dashboard.
        </p>

        <Link
          to="/account"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: 'var(--color-accent)',
            color: '#0a0a0b',
            borderRadius: 6,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Manage keys in your account
        </Link>

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

      {/* REST API */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ ...heading, fontSize: isMobile ? 18 : 20, marginBottom: 12 }}>REST API</h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 640,
          }}
        >
          Slashr also has a JSON REST API for direct integration: events, validators, rankings,
          delegation health checks, and more. Your API key works for both MCP and REST.
        </p>
        <a
          href="https://docs.slashr.dev"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 16,
            padding: '8px 18px',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-medium)',
            borderRadius: 6,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            textDecoration: 'none',
            transition: 'border-color 0.15s ease',
          }}
        >
          View full documentation →
        </a>
      </div>

      {/* Feeds + dataset. No key needed: these are the surfaces meant to be
          read by a person or a feed reader, not an integration. */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ ...heading, fontSize: isMobile ? 18 : 20, marginBottom: 12 }}>
          Feeds and dataset
        </h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 16px',
            maxWidth: 640,
          }}
        >
          No key required. Each feed is available as RSS, Atom and JSON Feed — swap the
          extension. Everything here is free to quote and excerpt with attribution.
        </p>
        <ul
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.8,
            margin: 0,
            paddingLeft: 20,
            maxWidth: 640,
          }}
        >
          <li>
            <code>/feed/slashing.rss</code> — real penalties only, on the chains whose
            protocol reduces stake. Roughly 15 items a week. Start here.
          </li>
          <li>
            <code>/feed/stories.rss</code> — one item per confirmed multi-validator
            incident rather than one per validator. Very quiet.
          </li>
          <li>
            <code>/feed/incidents.rss</code> — everything, roughly 175 items a week and
            mostly routine downtime.
          </li>
          <li>
            <a href="/data">/data</a> — the full event history as monthly CSV partitions,
            with per-chain coverage bounds and a dated release for each month. CC BY 4.0.
          </li>
        </ul>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'var(--color-text-dim)',
            lineHeight: 1.6,
            margin: '16px 0 0',
            maxWidth: 640,
          }}
        >
          Building your own view? <code>/v1/events</code> takes{' '}
          <code>severity</code>, <code>category</code>, <code>class</code> and{' '}
          <code>slashing</code> filters, which is how the curated feed above is defined.
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
        Slashr tracks validator incidents across {networks.length} networks. Built by{' '}
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
