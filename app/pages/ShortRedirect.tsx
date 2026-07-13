import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { resolveShortCode } from '@/api/client';

export default function ShortRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    resolveShortCode(code).then(result => {
      if (result) {
        navigate(`/validator/${result.network}/${result.address}`, { replace: true });
      } else {
        setError(true);
      }
    });
  }, [code, navigate]);

  if (error) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        validator not found
      </div>
    );
  }

  return null;
}
