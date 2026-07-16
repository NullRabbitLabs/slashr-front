import { useState, useEffect, useRef } from 'react';
import type { NetworkInfo } from '@/types/api';
import { fetchNetworks } from '@/api/client';

export function useNetworks(initial?: NetworkInfo[] | null) {
  const [networks, setNetworks] = useState<NetworkInfo[]>(initial ?? []);
  const [loading, setLoading] = useState(initial == null);
  const [error, setError] = useState<string | null>(null);
  // Skip the first client fetch when a loader already seeded the data.
  const skipFirst = useRef(initial != null);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
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
