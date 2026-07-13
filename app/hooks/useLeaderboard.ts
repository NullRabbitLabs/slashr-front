import { useState, useEffect, useCallback, useRef } from 'react';
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardSort, LeaderboardResponse } from '@/types/api';
import { fetchLeaderboard } from '@/api/client';

const PER_PAGE = 25;

export function useLeaderboard(
  network: string,
  period: LeaderboardPeriod,
  sort: LeaderboardSort,
  initial?: LeaderboardResponse | null,
) {
  const [validators, setValidators] = useState<LeaderboardEntry[]>(initial?.validators ?? []);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initial?.generated_at ?? null);
  const [loading, setLoading] = useState(initial == null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initial ? initial.validators.length >= PER_PAGE : false);
  const pageRef = useRef(1);
  // When seeded from a loader, page 1 is already present — skip the first fetch.
  const skipFirst = useRef(initial != null);

  // Reset and fetch page 1 when filters change
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    let cancelled = false;
    pageRef.current = 1;
    setLoading(true);
    setError(null);
    setValidators([]);
    setHasMore(false);

    fetchLeaderboard({ network, period, sort, page: 1, per_page: PER_PAGE })
      .then(res => {
        if (cancelled) return;
        const d = res.data;
        setValidators(d.validators);
        setGeneratedAt(d.generated_at);
        setHasMore(d.validators.length >= PER_PAGE);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [network, period, sort]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);

    fetchLeaderboard({ network, period, sort, page: nextPage, per_page: PER_PAGE })
      .then(res => {
        const d = res.data;
        pageRef.current = nextPage;
        setValidators(prev => [...prev, ...d.validators]);
        setHasMore(d.validators.length >= PER_PAGE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [network, period, sort, loadingMore, hasMore]);

  return { validators, generatedAt, loading, loadingMore, error, hasMore, loadMore };
}
