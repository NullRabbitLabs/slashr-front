import { useState, useEffect, useRef } from 'react';
import type { ReportResponse } from '@/types/api';
import { fetchReport } from '@/api/client';

export function useReport(
  providerSlug: string,
  period?: string,
  initial?: ReportResponse | null,
) {
  const [report, setReport] = useState<ReportResponse | null>(initial ?? null);
  const [loading, setLoading] = useState(initial == null);
  const [error, setError] = useState<string | null>(null);
  const skipFirst = useRef(initial != null);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
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
