import { useState, useEffect } from 'react';
import type { ChainDataResponse } from '@/types/api';
import { fetchChainData } from '@/api/client';

export function useChainData(network: string, address: string) {
  const [chainData, setChainData] = useState<ChainDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchChainData(network, address)
      .then(res => {
        if (!cancelled) setChainData(res?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setChainData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [network, address]);

  return { chainData, loading };
}
