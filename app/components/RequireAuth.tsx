import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

/**
 * Route guard: renders children only for signed-in users. While the session is
 * resolving it shows a light placeholder; unauthenticated users are redirected
 * to /login with a `return` param so they land back here after signing in.
 *
 * This is the UX gate. The API independently enforces the same boundary on the
 * gated data endpoints, so the data isn't reachable without a session either.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) {
    return (
      <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-2)' }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    const ret = encodeURIComponent(pathname + search);
    return <Navigate to={`/login?return=${ret}`} replace />;
  }

  return <>{children}</>;
}
