import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReportProviderItem } from '@/types/api';
import { fetchReportProviders } from '@/api/client';

const PER_PAGE = 25;

export type ReportProvidersResponse = Awaited<ReturnType<typeof fetchReportProviders>>;

export function useReportProviders(
  search?: string,
  letter?: string,
  initial?: ReportProvidersResponse | null,
) {
  const [providers, setProviders] = useState<ReportProviderItem[]>(initial?.data ?? []);
  const [loading, setLoading] = useState(initial == null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initial ? initial.data.length >= PER_PAGE : false);
  const pageRef = useRef(1);
  const skipFirst = useRef(initial != null);

  // Reset and fetch page 1 when filters change
  useEffect(() => {
    // Skip the initial page-1 fetch when the loader already seeded it.
    if (skipFirst.current) { skipFirst.current = false; return; }
    let cancelled = false;
    pageRef.current = 1;
    setLoading(true);
    setError(null);
    setProviders([]);
    setHasMore(false);

    fetchReportProviders({ search, letter, page: 1, per_page: PER_PAGE })
      .then(res => {
        if (cancelled) return;
        const items = res.data;
        setProviders(items);
        setHasMore(items.length >= PER_PAGE);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [search, letter]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);

    fetchReportProviders({ search, letter, page: nextPage, per_page: PER_PAGE })
      .then(res => {
        const items = res.data;
        pageRef.current = nextPage;
        setProviders(prev => [...prev, ...items]);
        setHasMore(items.length >= PER_PAGE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [search, letter, loadingMore, hasMore]);

  return { providers, loading, loadingMore, error, hasMore, loadMore };
}
