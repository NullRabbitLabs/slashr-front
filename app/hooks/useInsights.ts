import { useState, useEffect, useRef } from 'react';
import type { InsightsResponse } from '@/types/api';
import { fetchInsights } from '@/api/client';

export function useInsights(initial?: InsightsResponse | null) {
  const [data, setData] = useState<InsightsResponse | null>(initial ?? null);
  const [loading, setLoading] = useState(initial == null);
  const [error, setError] = useState<string | null>(null);
  const skipFirst = useRef(initial != null);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    let cancelled = false;
    fetchInsights()
      .then(res => {
        if (!cancelled) setData(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
