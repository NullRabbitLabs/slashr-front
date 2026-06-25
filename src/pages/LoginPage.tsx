import { useCallback, useState } from 'react';
import { requestMagicLink } from '@/api/auth';
import { TurnstileWidget, turnstileEnabled } from '@/components/TurnstileWidget';

function isValidEmail(email: string): boolean {
  const [local, domain, ...rest] = email.trim().split('@');
  return rest.length === 0 && !!local && !!domain && domain.includes('.');
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onToken = useCallback((t: string | null) => setToken(t), []);

  const canSubmit =
    isValidEmail(email) && !submitting && (!turnstileEnabled || !!token);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await requestMagicLink(email.trim().toLowerCase(), token ?? '');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '64px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8, color: 'var(--text)' }}>Sign in to Slashr</h1>
      <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
        Accounts unlock the API and MCP access. We&rsquo;ll email you a sign-in link — no password
        to remember.
      </p>

      {sent ? (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          <strong>Check your email.</strong>
          <p style={{ color: 'var(--text-2)', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
            If <span style={{ color: 'var(--text)' }}>{email.trim().toLowerCase()}</span> has an
            account (or once it does), a sign-in link is on its way. The link expires in 15 minutes.
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email" style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 15,
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />

          <TurnstileWidget onToken={onToken} />

          {error && (
            <p style={{ color: 'var(--crit)', fontSize: 14, marginTop: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              marginTop: 20,
              width: '100%',
              padding: '11px 16px',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              borderRadius: 6,
              background: canSubmit ? 'var(--accent)' : 'var(--surface-2)',
              color: canSubmit ? '#fff' : 'var(--text-3)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
      )}
    </div>
  );
}
