import type { HealthCheckResponse } from '@/types/api';
import { GRADE_COLORS } from '@/lib/grades';
import { NETWORK_META } from '@/lib/constants';

interface Props {
  data: HealthCheckResponse;
}

/**
 * Off-screen 1200x630 card rendered for html2canvas capture.
 * Uses hardcoded colors (not CSS vars) because html2canvas
 * doesn't always resolve custom properties.
 */
export function HealthCardPng({ data }: Props) {
  const p = data.portfolio;
  const gradeColor = GRADE_COLORS[p.grade] ?? '#FF4545';
  const meta = NETWORK_META[data.network];
  const costZero = (p.total_cost_of_downtime_usd ?? 0) === 0;

  const worst = data.validators.length > 0 ? data.validators[0] : null;
  const best = data.validators.length > 1 ? data.validators[data.validators.length - 1] : null;

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: '#0a0a0b',
        color: '#e8e8e8',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        padding: '48px 60px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* Top: logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#14f195' }}>
          slashr.dev
        </span>
      </div>

      {/* Middle: grade + cost */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          {/* Grade */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 12,
              background: `${gradeColor}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              color: gradeColor,
            }}
          >
            {p.grade}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#e8e8e8', marginBottom: 4 }}>
              Staking Health Check
            </div>
            <div style={{ fontSize: 16, color: '#888' }}>
              Score {p.score}/100
            </div>
          </div>
        </div>

        {/* Cost */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Cost of downtime ({p.cost_period_days}d)
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              color: costZero ? '#14f195' : '#FF4545',
            }}
          >
            {costZero
              ? '$0'
              : `$${(p.total_cost_of_downtime_usd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, fontSize: 15, color: '#888' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta?.color ?? '#888' }} />
            {meta?.name ?? data.network}
          </span>
          <span>{p.validator_count} validator{p.validator_count !== 1 ? 's' : ''}</span>
          {p.validators_at_risk > 0 && (
            <span style={{ color: '#FF4545' }}>{p.validators_at_risk} at risk</span>
          )}
        </div>

        {/* Worst / best */}
        {worst && best && worst.address !== best.address && (
          <div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
            Worst: {worst.name ?? worst.address.slice(0, 12)} ({worst.grade})
            {' \u00b7 '}
            Best: {best.name ?? best.address.slice(0, 12)} ({best.grade})
          </div>
        )}
      </div>

      {/* Bottom: CTA */}
      <div style={{ fontSize: 14, color: '#555' }}>
        Check your validators at slashr.dev/check
      </div>
    </div>
  );
}
