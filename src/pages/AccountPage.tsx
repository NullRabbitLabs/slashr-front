import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 20px' }}>
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
    <div style={{ maxWidth: 520, margin: '64px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24, color: 'var(--text)' }}>Your account</h1>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', margin: 0 }}>
        <dt style={{ color: 'var(--text-2)', fontSize: 14 }}>Email</dt>
        <dd style={{ margin: 0, color: 'var(--text)' }}>{user.email}</dd>
        <dt style={{ color: 'var(--text-2)', fontSize: 14 }}>Plan</dt>
        <dd style={{ margin: 0, color: 'var(--text)', textTransform: 'capitalize' }}>{user.plan}</dd>
      </dl>

      <section
        style={{
          marginTop: 32,
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 20,
          background: 'var(--surface)',
        }}
      >
        <h2 style={{ fontSize: 16, margin: '0 0 8px', color: 'var(--text)' }}>API &amp; MCP keys</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
          Account-bound API keys are coming next. They&rsquo;ll inherit your plan&rsquo;s limits and
          be managed here.
        </p>
      </section>

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
