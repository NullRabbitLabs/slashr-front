import { useState, useEffect } from 'react';
import type { NetworkInfo } from '@/types/api';
import { fetchNetworks } from '@/api/client';

export function useNetworks() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNetworks()
      .then(res => {
        if (!cancelled) setNetworks(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { networks, loading, error };
}
