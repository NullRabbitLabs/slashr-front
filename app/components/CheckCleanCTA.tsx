import { useState, useCallback } from 'react';

interface CheckCleanCTAProps {
  walletAddress: string;
  network: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CheckCleanCTA({ walletAddress, network }: CheckCleanCTAProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!email || !EMAIL_RE.test(email)) {
      setError('enter a valid email');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          integrations: [],
          other: `check-page: ${network}/${walletAddress}`,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'something went wrong');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('could not reach the server');
    } finally {
      setSubmitting(false);
    }
  }, [email, network, walletAddress]);

  if (success) {
    return (
      <div
        style={{
          fontSize: 13,
          color: 'var(--color-text-hover)',
          fontFamily: "'JetBrains Mono', monospace",
          padding: '16px 0',
        }}
      >
        noted. we'll let you know.
      </div>
    );
  }

  return (
    <div>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          fontFamily: "'Inter', sans-serif",
          margin: '0 0 10px',
        }}
      >
        Want to know if that changes?
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(null); }}
          className="waitlist-input"
          style={{
            flex: 1,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-medium)',
            borderRadius: 4,
            color: 'var(--color-text-primary)',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            padding: '8px 12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '8px 14px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting ? 'var(--color-bg-surface)' : 'var(--color-separator)',
            border: '1px solid var(--color-border-strong)',
            color: submitting ? 'var(--color-text-dim)' : 'var(--color-text-hover)',
            whiteSpace: 'nowrap',
          }}
        >
          {submitting ? 'sending...' : 'notify me'}
        </button>
      </div>
      {error && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-danger)',
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 8,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
