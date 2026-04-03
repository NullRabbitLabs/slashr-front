import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface WaitlistPayload {
  email: string;
  integrations: string[];
  other: string;
}

const INTEGRATIONS = ['Slack', 'PagerDuty', 'Webhook / API', 'Telegram'] as const;

export function WaitlistDrawer() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [integrations, setIntegrations] = useState<Set<string>>(new Set());
  const [other, setOther] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Body scroll lock + focus email
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      emailRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const toggleIntegration = useCallback((name: string) => {
    setIntegrations(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('enter a valid email');
      return;
    }
    setSubmitting(true);
    try {
      const payload: WaitlistPayload = {
        email,
        integrations: [...integrations],
        other,
      };
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
  }, [email, integrations, other]);

  return (
    <>
      {/* Trigger button - fixed bottom-right */}
      <button
        onClick={() => {
          setOpen(true);
          setSuccess(false);
          setError(null);
        }}
        className="btn-ghost"
        style={{
          position: 'fixed',
          bottom: isMobile ? 16 : 24,
          right: isMobile ? 16 : 24,
          background: 'var(--color-border)',
          border: '1px solid var(--color-border-medium)',
          borderRadius: 6,
          color: 'var(--color-text-secondary)',
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          padding: '8px 14px',
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        stay in the loop {'\u2197'}
      </button>

      {/* Overlay */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            background: 'var(--color-overlay)',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-medium)',
              borderRadius: isMobile ? '12px 12px 0 0' : 8,
              padding: isMobile ? '24px 20px 32px' : '32px 28px',
              width: isMobile ? '100%' : 420,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {success ? (
              <div
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-hover)',
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'center',
                  padding: '24px 0',
                }}
              >
                noted. we'll be in touch.
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                    letterSpacing: '-0.02em',
                    margin: '0 0 6px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  stay in the loop
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-tertiary)',
                    margin: '0 0 20px',
                    lineHeight: 1.5,
                  }}
                >
                  We'll let you know when integrations land. No newsletters.
                </p>

                {/* Email */}
                <input
                  ref={emailRef}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="waitlist-input"
                  style={{
                    width: '100%',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-medium)',
                    borderRadius: 4,
                    color: 'var(--color-text-primary)',
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '10px 12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Integrations */}
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-tertiary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: 8,
                    }}
                  >
                    what would you plug this into?
                  </div>
                  {INTEGRATIONS.map(name => (
                    <label
                      key={name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: 'var(--color-text-hover)',
                        fontFamily: "'JetBrains Mono', monospace",
                        padding: '4px 0',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={integrations.has(name)}
                        onChange={() => toggleIntegration(name)}
                        style={{ accentColor: 'var(--color-danger)' }}
                      />
                      {name}
                    </label>
                  ))}
                </div>

                {/* Other */}
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-tertiary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: 6,
                    }}
                  >
                    anything else?
                  </div>
                  <textarea
                    placeholder="grafana, opsgenie, ..."
                    value={other}
                    onChange={e => setOther(e.target.value)}
                    rows={2}
                    className="waitlist-input"
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-medium)',
                      borderRadius: 4,
                      color: 'var(--color-text-primary)',
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', monospace",
                      padding: '10px 12px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-danger)',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 12,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    marginTop: 16,
                    width: '100%',
                    background: submitting
                      ? 'var(--color-bg-surface)'
                      : 'var(--color-separator)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 4,
                    color: submitting
                      ? 'var(--color-text-dim)'
                      : 'var(--color-text-hover)',
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '10px 0',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'submitting...' : 'register interest'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
