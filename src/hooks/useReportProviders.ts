import { useState, useEffect } from 'react';
import type { ReportProviderItem } from '@/types/api';
import { fetchReportProviders } from '@/api/client';

export function useReportProviders() {
  const [providers, setProviders] = useState<ReportProviderItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchReportProviders()
      .then(res => {
        if (!cancelled) setProviders(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { providers, loading, error };
}
