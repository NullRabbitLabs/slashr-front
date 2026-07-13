import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKey,
  type CreatedKey,
} from '@/api/auth';

const MAX_KEYS = 4;

function KeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState<CreatedKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setKeys(await listApiKeys());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await createApiKey(name.trim());
      setFresh(created);
      setName('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create key.');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: number) => {
    setError(null);
    try {
      await revokeApiKey(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not revoke key.');
    }
  };

  const active = keys.filter((k) => !k.revoked_at);
  const atLimit = active.length >= MAX_KEYS;

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, margin: '0 0 4px', color: 'var(--text)' }}>API &amp; MCP keys</h2>
      <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.5, margin: '0 0 16px' }}>
        Use a key as a bearer token for the REST API and MCP server. It inherits your plan&rsquo;s
        limits.
      </p>

      {fresh && (
        <div
          style={{
            border: '1px solid var(--accent)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            background: 'var(--surface)',
          }}
        >
          <strong style={{ color: 'var(--text)' }}>Copy your key now — it won&rsquo;t be shown again.</strong>
          <code
            style={{
              display: 'block',
              marginTop: 8,
              padding: '8px 10px',
              background: 'var(--surface-2)',
              borderRadius: 6,
              color: 'var(--text)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 13,
              wordBreak: 'break-all',
            }}
          >
            {fresh.key}
          </code>
          <button
            onClick={() => void navigator.clipboard?.writeText(fresh.key)}
            style={{ marginTop: 8, fontSize: 13, padding: '4px 10px', cursor: 'pointer' }}
          >
            Copy
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. CI, laptop)"
          style={{
            flex: 1,
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        />
        <button
          onClick={create}
          disabled={creating || atLimit}
          title={atLimit ? `Limit of ${MAX_KEYS} keys reached` : undefined}
          style={{
            padding: '8px 16px',
            fontWeight: 600,
            border: 'none',
            borderRadius: 6,
            background: creating || atLimit ? 'var(--surface-2)' : 'var(--accent)',
            color: creating || atLimit ? 'var(--text-3)' : '#fff',
            cursor: creating || atLimit ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {creating ? 'Creating…' : 'Create key'}
        </button>
      </div>

      <p style={{ color: 'var(--text-3)', fontSize: 12.5, margin: '0 0 16px' }}>
        {active.length} of {MAX_KEYS} keys used{atLimit ? ' — revoke one to create another.' : '.'}
      </p>

      {error && <p style={{ color: 'var(--crit)', fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-2)' }}>Loading keys…</p>
      ) : active.length === 0 ? (
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>No active keys yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {active.map((k) => (
            <li
              key={k.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderTop: '1px solid var(--border)',
              }}
            >
              <span>
                <code style={{ color: 'var(--text)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {k.key_prefix}…
                </code>
                <span style={{ color: 'var(--text-2)', fontSize: 13, marginLeft: 10 }}>
                  {k.name} · {k.requests_total} reqs
                </span>
              </span>
              <button
                onClick={() => revoke(k.id)}
                style={{
                  fontSize: 13,
                  padding: '4px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--crit)',
                  cursor: 'pointer',
                }}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ maxWidth: 560, margin: '64px auto', padding: '0 20px' }}>
        <p style={{ color: 'var(--text-2)' }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const onSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ maxWidth: 560, margin: '64px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24, color: 'var(--text)' }}>Your account</h1>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', margin: 0 }}>
        <dt style={{ color: 'var(--text-2)', fontSize: 14 }}>Email</dt>
        <dd style={{ margin: 0, color: 'var(--text)' }}>{user.email}</dd>
        <dt style={{ color: 'var(--text-2)', fontSize: 14 }}>Plan</dt>
        <dd style={{ margin: 0, color: 'var(--text)', textTransform: 'capitalize' }}>{user.plan}</dd>
      </dl>

      <KeyManager />

      <button
        onClick={onSignOut}
        style={{
          marginTop: 32,
          padding: '9px 16px',
          fontSize: 14,
          fontWeight: 600,
          border: '1px solid var(--border)',
          borderRadius: 6,
          background: 'transparent',
          color: 'var(--text)',
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
