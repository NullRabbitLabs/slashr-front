import { useState, useCallback } from 'react';
import type { HealthCheckResponse } from '@/types/api';
import { fetchHealthCheck } from '@/api/client';

export function useHealthCheck() {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetchHealthCheck(address);
      setData(res.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, check, reset };
}
