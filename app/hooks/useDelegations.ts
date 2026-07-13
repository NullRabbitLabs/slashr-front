import { useState, useCallback } from 'react';
import type { DelegationResponse } from '@/types/api';
import { fetchDelegations } from '@/api/client';

export function useDelegations() {
  const [data, setData] = useState<DelegationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (network: string, walletAddress: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetchDelegations(network, walletAddress);
      setData(res.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, lookup };
}
