// The NRDAX join, consumer side. Pure helpers for turning a validator's real
// risk signals into the deduped set of NRDAX technique links to render in the
// risk detail. Additive and mapping-gated: signals with no mapping contribute
// nothing, so nothing about the existing drawer changes for unmapped signals.

import type { NrdaxTechniqueLink, RiskSignalDetail } from '@/types/api';

/**
 * Collect the distinct NRDAX technique links across a validator's signals,
 * sorted by id. Unmapped signals (empty `techniques`) contribute nothing.
 * Null/undefined tolerant so a partial or failed fetch degrades to "no links"
 * rather than throwing.
 */
export function collectNrdaxTechniques(
  signals: RiskSignalDetail[] | null | undefined,
): NrdaxTechniqueLink[] {
  const byId = new Map<string, NrdaxTechniqueLink>();
  for (const s of signals ?? []) {
    for (const t of s?.techniques ?? []) {
      if (t && t.id && !byId.has(t.id)) byId.set(t.id, t);
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}
