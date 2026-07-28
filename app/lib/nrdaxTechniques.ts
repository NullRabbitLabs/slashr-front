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
/** A ready-to-render NRDAX shield badge for a technique: the SVG source and the
 * link target, both UTM-tagged so NRDAX can attribute the referral the join
 * drives (badge impression + click-through). */
export interface NrdaxBadge {
  href: string;
  badgeSrc: string;
  alt: string;
}

/**
 * Build the NRDAX badge + UTM-tagged link for a technique. `placement`
 * (e.g. `validator-profile`, `risk-drawer`) becomes the utm_medium so NRDAX can
 * see which surface referred the traffic. The badge origin is derived from the
 * technique url (so a staging registry badges correctly), falling back to
 * nrdax.com if the url is malformed.
 */
export function nrdaxBadge(link: NrdaxTechniqueLink, placement: string): NrdaxBadge {
  let origin = 'https://nrdax.com';
  try {
    origin = new URL(link.url).origin;
  } catch {
    // keep the default origin
  }
  const utm = `utm_source=slashr.dev&utm_medium=${encodeURIComponent(placement)}&utm_campaign=nrdax-join`;
  const withUtm = (u: string) => `${u}${u.includes('?') ? '&' : '?'}${utm}`;
  return {
    href: withUtm(link.url),
    badgeSrc: withUtm(`${origin}/badge/${encodeURIComponent(link.id)}.svg`),
    alt: `${link.id} in the NRDAX registry`,
  };
}

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
