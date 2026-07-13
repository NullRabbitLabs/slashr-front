import { useState, useEffect, useRef } from 'react';
import type { RiskListResponse, RiskValidatorItem } from '@/types/api';
import { fetchRiskValidators } from '@/api/client';

/**
 * Fetch the Slashr Risk Index. `network` of 'all' (or undefined) returns every
 * network; the list is already ranked by risk score on the server.
 *
 * `initial` seeds the hook from a server loader (SSR). When present, the state
 * starts populated and the first client-side fetch is skipped so we don't
 * immediately re-request the same data on hydration. Refetch-on-filter-change
 * still fires normally once the network/limit changes.
 */
export function useRiskValidators(
  network?: string,
  limit = 200,
  initial: RiskListResponse | null = null,
) {
  const [validators, setValidators] = useState<RiskValidatorItem[]>(initial?.validators ?? []);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initial?.generated_at ?? null);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [loading, setLoading] = useState(initial == null);
  const [error, setError] = useState<string | null>(null);
  const skipFirst = useRef(initial != null);

  const net = network && network !== 'all' ? network : undefined;

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRiskValidators({ network: net, limit })
      .then(res => {
        if (cancelled) return;
        setValidators(res.data.validators);
        setGeneratedAt(res.data.generated_at);
        setTotal(res.data.total);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [net, limit]);

  return { validators, generatedAt, total, loading, error };
}
