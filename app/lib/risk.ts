import type { NetworkSlug, RiskStatus, RiskTier, RiskValidatorItem } from '@/types/api';
import { NETWORK_META } from './constants';

/** Tier → primary colour token. Mirrors tierOf() in the design mock. */
export function tierColor(tier: RiskTier): string {
  switch (tier) {
    case 'critical': return 'var(--crit)';
    case 'elevated': return 'var(--warn)';
    case 'moderate': return 'var(--accent)';
    default: return 'var(--ok)';
  }
}

/** Tier → soft/background colour token. */
export function tierSoft(tier: RiskTier): string {
  switch (tier) {
    case 'critical': return 'var(--crit-soft)';
    case 'elevated': return 'var(--warn-soft)';
    case 'moderate': return 'var(--accent-soft)';
    default: return 'var(--ok-soft)';
  }
}

export function tierLabel(tier: RiskTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function netColor(network: string): string {
  return NETWORK_META[network as NetworkSlug]?.color ?? 'var(--text-3)';
}

export function netTicker(network: string): string {
  return NETWORK_META[network as NetworkSlug]?.ticker ?? network.toUpperCase();
}

export interface StatusMeta {
  label: string;
  color: string;
}

export function statusMeta(status: RiskStatus): StatusMeta {
  switch (status) {
    case 'incident': return { label: 'Active incident', color: 'var(--crit)' };
    case 'watch': return { label: 'On watch', color: 'var(--warn)' };
    default: return { label: 'Healthy', color: 'var(--ok)' };
  }
}

/** Build an SVG polyline points string from a numeric series. */
export function sparkPoints(arr: number[], w = 84, h = 20): string {
  if (arr.length === 0) return '';
  const mx = Math.max(...arr, 1);
  const mn = Math.min(...arr);
  const range = mx - mn || 1;
  return arr
    .map((v, i) => {
      const x = (i / Math.max(arr.length - 1, 1)) * w;
      const y = h - ((v - mn) / range) * h + 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export interface RiskSignal {
  label: string;
  pct: number;
  valLabel: string;
  color: string;
}

function clamp(n: number): number {
  return Math.max(3, Math.min(100, Math.round(n)));
}

function signalLabel(val: number): string {
  if (val >= 70) return 'High';
  if (val >= 45) return 'Elevated';
  if (val >= 25) return 'Moderate';
  return 'Low';
}

function signalColor(val: number): string {
  if (val >= 70) return 'var(--crit)';
  if (val >= 45) return 'var(--warn)';
  if (val >= 25) return 'var(--accent)';
  return 'var(--ok)';
}

/**
 * Risk-signal breakdown for the detail drawer, derived from the fields the
 * API serves today. Vote participation is a placeholder until the 30-day
 * uptime/missed-vote metric lands (see RiskValidatorItem.uptime_30d).
 */
export function signalsFor(v: RiskValidatorItem): RiskSignal[] {
  const incidents = v.incident_count_30d;
  const comm = v.commission_pct ?? 0;
  const raw = [
    { label: 'Downtime risk', val: clamp(incidents * 7 + v.risk_score / 3) },
    { label: 'Slashing history', val: clamp(v.slashing_count * 28 + v.risk_score / 4) },
    { label: 'Commission behavior', val: comm >= 50 ? 96 : clamp(comm * 6 + v.risk_score / 4) },
    {
      label: 'Vote participation',
      val: v.uptime_30d != null ? clamp((100 - v.uptime_30d) * 35) : clamp(v.risk_score / 2),
    },
  ];
  return raw.map(s => ({
    label: s.label,
    pct: s.val,
    valLabel: signalLabel(s.val),
    color: signalColor(s.val),
  }));
}

export function recommendationFor(risk: number): string {
  if (risk >= 75)
    return 'High probability of further reward loss. Not recommended for new delegation. Existing stake should be migrated or closely alerted.';
  if (risk >= 60)
    return 'Elevated risk from recent downtime or commission moves. Suitable only with active monitoring and alerting in place.';
  if (risk >= 40)
    return 'Moderate risk. Acceptable for diversified delegation with standard monitoring; watch commission and uptime trend.';
  return 'Low risk. Strong uptime and clean slashing history. Suitable for institutional and treasury delegation.';
}

export function summaryFor(risk: number): string {
  if (risk >= 75) return 'Repeated incidents and high stake exposure. Active risk to delegator rewards.';
  if (risk >= 60) return 'Recent instability detected. Trending in the wrong direction.';
  if (risk >= 40) return 'Generally stable with occasional events worth monitoring.';
  return 'Consistently reliable with a clean recent record.';
}
