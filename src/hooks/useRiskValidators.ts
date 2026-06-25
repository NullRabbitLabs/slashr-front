import { useState, useEffect } from 'react';
import type { RiskValidatorItem } from '@/types/api';
import { fetchRiskValidators } from '@/api/client';

/**
 * Fetch the Slashr Risk Index. `network` of 'all' (or undefined) returns every
 * network; the list is already ranked by risk score on the server.
 */
export function useRiskValidators(network?: string, limit = 200) {
  const [validators, setValidators] = useState<RiskValidatorItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const net = network && network !== 'all' ? network : undefined;

  useEffect(() => {
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
