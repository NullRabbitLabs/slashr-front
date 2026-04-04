import type { PortfolioSummary, NetworkSlug } from '@/types/api';
import { GradeBadge } from './GradeBadge';
import { gradeColor } from '@/lib/grades';
import { formatUsdLarge, formatUsd } from '@/lib/format';
import { NETWORK_META } from '@/lib/constants';

interface Props {
  portfolio: PortfolioSummary;
  network: NetworkSlug;
  onShare?: () => void;
}

export function PortfolioSummaryCard({ portfolio, network, onShare }: Props) {
  const meta = NETWORK_META[network];
  const costIsZero = (portfolio.total_cost_of_downtime_usd ?? 0) === 0;

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        padding: 24,
      }}
    >
      {/* Top row: grade + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <GradeBadge grade={portfolio.grade} size="lg" />
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-dim)',
              marginBottom: 2,
            }}
          >
            Portfolio Health
          </div>
          <div
            style={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              color: gradeColor(portfolio.grade),
            }}
          >
            Score {portfolio.score}/100
          </div>
        </div>
      </div>

      {/* Cost headline */}
      <div
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-dim)',
          marginBottom: 4,
        }}
      >
        Cost of downtime ({portfolio.cost_period_days}d)
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: costIsZero ? 'var(--color-accent)' : 'var(--color-danger)',
          marginBottom: 16,
        }}
      >
        {costIsZero
          ? '$0 \u2014 your validators are clean'
          : formatUsdLarge(portfolio.total_cost_of_downtime_usd)}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 12,
          fontFamily: "'Inter', sans-serif",
          color: 'var(--color-text-tertiary)',
          alignItems: 'center',
        }}
      >
        {portfolio.total_stake_usd != null && (
          <span>{formatUsd(portfolio.total_stake_usd)} staked</span>
        )}
        <span>{portfolio.validator_count} validator{portfolio.validator_count !== 1 ? 's' : ''}</span>
        {portfolio.validators_at_risk > 0 && (
          <span style={{ color: 'var(--color-danger)' }}>
            {portfolio.validators_at_risk} at risk
          </span>
        )}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: meta?.color ?? 'var(--color-text-dim)',
            }}
          />
          {meta?.name ?? network}
        </span>
      </div>

      {/* Share button */}
      {onShare && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          <button
            onClick={onShare}
            style={{
              padding: '6px 16px',
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Share
          </button>
        </div>
      )}
    </div>
  );
}
