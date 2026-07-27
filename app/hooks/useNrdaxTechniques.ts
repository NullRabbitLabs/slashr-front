import { useEffect, useState } from 'react';
import type { NrdaxTechniqueLink } from '@/types/api';
import { fetchValidatorRiskSignals } from '@/api/client';
import { collectNrdaxTechniques } from '@/lib/nrdaxTechniques';

/**
 * The NRDAX techniques behind a validator's mapped risk signals, for the risk
 * detail. Additive and best-effort: any failure (join disabled, API down,
 * validator on a gated network) leaves the list empty and the drawer renders
 * exactly as it did before — the join degrades to no-links, never an error.
 */
export function useNrdaxTechniques(network: string, address: string): NrdaxTechniqueLink[] {
  const [techniques, setTechniques] = useState<NrdaxTechniqueLink[]>([]);

  useEffect(() => {
    let cancelled = false;
    setTechniques([]);
    fetchValidatorRiskSignals(network, address)
      .then((res) => {
        if (!cancelled) setTechniques(collectNrdaxTechniques(res.data.signals));
      })
      .catch(() => {
        if (!cancelled) setTechniques([]);
      });
    return () => {
      cancelled = true;
    };
  }, [network, address]);

  return techniques;
}
