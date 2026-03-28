import { useState, useEffect } from 'react';
import type { ReportResponse } from '@/types/api';
import { fetchReport } from '@/api/client';

export function useReport(providerSlug: string, period?: string) {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReport(providerSlug, period)
      .then(res => {
        if (!cancelled) setReport(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [providerSlug, period]);

  return { report, loading, error };
}
