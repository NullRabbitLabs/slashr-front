import { useState, useEffect } from 'react';
import type { LeaderboardResponse, LeaderboardPeriod, LeaderboardSort } from '@/types/api';
import { fetchLeaderboard } from '@/api/client';

export function useLeaderboard(network: string, period: LeaderboardPeriod, sort: LeaderboardSort) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchLeaderboard({ network, period, sort, limit: 200 })
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
  }, [network, period, sort]);

  return { data, loading, error };
}
