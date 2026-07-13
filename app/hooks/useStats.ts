import { useState, useEffect, useRef } from 'react';
import type { StatsResponse } from '@/types/api';
import { fetchStats } from '@/api/client';

export function useStats(initial?: StatsResponse | null) {
  const [stats, setStats] = useState<StatsResponse | null>(initial ?? null);
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
    fetchStats()
      .then(res => {
        if (!cancelled) setStats(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}
