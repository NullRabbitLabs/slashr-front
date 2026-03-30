import { useState, useEffect } from 'react';
import type { ValidatorProfile } from '@/types/api';
import { fetchValidator } from '@/api/client';

export function useValidator(network: string, address: string) {
  const [validator, setValidator] = useState<ValidatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchValidator(network, address)
      .then(res => {
        if (!cancelled) setValidator(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [network, address]);

  return { validator, loading, error };
}
