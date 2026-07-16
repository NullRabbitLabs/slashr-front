import { useState, useEffect, useRef } from 'react';
import type { NetworkDirectoryResponse, NetworkValidatorItem } from '@/types/api';
import { fetchNetworkValidators } from '@/api/client';

/**
 * Fetch a single network's validator directory (the track-record view: every
 * validator, clean ones included). Refetches when `network` changes, so the
 * directory's network pills can switch client-side.
 *
 * `initial` seeds from an SSR loader and skips the first client fetch on
 * hydration, matching the pattern in {@link useRiskValidators}.
 */
export function useNetworkValidators(
  network: string,
  initial: NetworkDirectoryResponse | null = null,
) {
  const [validators, setValidators] = useState<NetworkValidatorItem[]>(
    initial?.validators ?? [],
  );
  const [monitoringSince, setMonitoringSince] = useState<string | null>(
    initial?.monitoring_since ?? null,
  );
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

    fetchNetworkValidators(network, { limit: 100 })
      .then(res => {
        if (cancelled) return;
        setValidators(res.validators);
        setMonitoringSince(res.monitoring_since);
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
  }, [network]);

  return { validators, monitoringSince, loading, error };
}
