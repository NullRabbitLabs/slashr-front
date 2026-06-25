import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMagicLink } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';

type State = 'verifying' | 'error';

export default function AuthVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [state, setState] = useState<State>('verifying');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-invoke (token is single-use)
    ran.current = true;

    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('This sign-in link is missing its token.');
      return;
    }

    void (async () => {
      try {
        await verifyMagicLink(token);
        await refresh();
        const ret = sessionStorage.getItem('slashr_return');
        sessionStorage.removeItem('slashr_return');
        navigate(ret || '/account', { replace: true });
      } catch (err) {
        setState('error');
        setMessage(err instanceof Error ? err.message : 'This sign-in link is invalid or has expired.');
      }
    })();
  }, [params, navigate, refresh]);

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      {state === 'verifying' ? (
        <p style={{ color: 'var(--text-2)', fontSize: 16 }}>Signing you in…</p>
      ) : (
        <>
          <h1 style={{ fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>Couldn&rsquo;t sign you in</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.5 }}>{message}</p>
          <a href="/login" style={{ color: 'var(--accent)', display: 'inline-block', marginTop: 16 }}>
            Request a new link
          </a>
        </>
      )}
    </div>
  );
}
