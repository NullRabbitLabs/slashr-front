import { useState } from 'react';
import type { InsightsResponse } from '@/types/api';
import { useInsights } from '@/hooks/useInsights';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatUsd, formatCompact } from '@/lib/format';
import { Heatmap } from '@/components/insights/Heatmap';
import { HourChart } from '@/components/insights/HourChart';
import { DowChart } from '@/components/insights/DowChart';
import { LossChart } from '@/components/insights/LossChart';
import { NetworkBreakdown } from '@/components/insights/NetworkBreakdown';
import { TopOffenders } from '@/components/insights/TopOffenders';

type LossMode = 'daily' | 'cumulative';

const SECTION_HEADING: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--color-text-dim)',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const STAT_BOX: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.06)',
  padding: '10px 12px',
  fontFamily: "'JetBrains Mono', monospace",
};

const TOGGLE_BTN = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
  border: '1px solid',
  borderColor: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
  color: active ? 'var(--color-text-primary)' : 'var(--color-text-ghost)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '4px 10px',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export default function InsightsPage({ initialInsights }: { initialInsights?: InsightsResponse | null }) {
  usePageMeta({
    title: 'Insights \u00b7 slashr',
    description: 'Heatmaps, loss charts, and network breakdowns for validator penalties.',
  });

  const { data, loading, error } = useInsights(initialInsights);
  const isMobile = useIsMobile();
  const [lossMode, setLossMode] = useState<LossMode>('daily');

  if (loading) {
    return (
      <div style={{
        padding: '80px 0',
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: 'var(--color-text-ghost)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        loading insights...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        padding: '80px 0',
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: 'var(--color-text-dim)',
      }}>
        {error ?? 'no data available'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '0 12px' : '0' }}>
      {/* Title */}
      <div style={{ marginBottom: isMobile ? 16 : 28 }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: isMobile ? 22 : 28,
          letterSpacing: '-0.04em',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}>
          Network Insights
        </h1>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--color-text-ghost)',
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {data.period_days} days tracked // {formatCompact(data.unique_validators)} validators
        </p>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 6 : 12,
          marginBottom: isMobile ? 20 : 36,
        }}
      >
        <div style={STAT_BOX}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {formatCompact(data.total_events)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-ghost)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            events
          </div>
        </div>
        <div style={STAT_BOX}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#FF4545' }}>
            {formatUsd(data.total_loss_usd)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-ghost)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            est. losses
          </div>
        </div>
        <div style={STAT_BOX}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {formatCompact(data.unique_validators)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-ghost)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            validators
          </div>
        </div>
        <div style={STAT_BOX}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {data.period_days}
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-ghost)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            days tracked
          </div>
        </div>
      </div>

      {/* Activity section — heatmap full width */}
      <div style={{ marginBottom: isMobile ? 20 : 32 }}>
        <div style={SECTION_HEADING}>
          <span style={{ color: '#FF4545', fontSize: 6 }}>{'\u25A0'}</span>
          Penalty Activity
        </div>
        <Heatmap daily={data.daily} />
      </div>

      {/* Hour of Day + Day of Week — side by side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 16 : 24,
          marginBottom: isMobile ? 20 : 40,
        }}
      >
        <div>
          <div style={SECTION_HEADING}>
            <span style={{ color: '#FF4545', fontSize: 6 }}>{'\u25A0'}</span>
            Hour of Day
            <span style={{ fontSize: 9, color: 'var(--color-text-ghost)', fontWeight: 400 }}>utc</span>
          </div>
          <HourChart data={data.by_hour} />
        </div>
        <div>
          <div style={SECTION_HEADING}>
            <span style={{ color: '#FF4545', fontSize: 6 }}>{'\u25A0'}</span>
            Day of Week
          </div>
          <DowChart data={data.by_dow} />
        </div>
      </div>

      {/* Loss chart */}
      <div style={{ marginBottom: isMobile ? 20 : 40 }}>
        <div style={{ ...SECTION_HEADING, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#FF4545', fontSize: 6 }}>{'\u25A0'}</span>
            Estimated Losses (USD)
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            <button style={TOGGLE_BTN(lossMode === 'daily')} onClick={() => setLossMode('daily')}>
              daily
            </button>
            <button style={TOGGLE_BTN(lossMode === 'cumulative')} onClick={() => setLossMode('cumulative')}>
              cumul
            </button>
          </div>
        </div>
        <LossChart daily={data.daily} mode={lossMode} />
      </div>

      {/* Network breakdown */}
      <div style={{ marginBottom: isMobile ? 20 : 40 }}>
        <div style={SECTION_HEADING}>
          <span style={{ color: '#FF4545', fontSize: 6 }}>{'\u25A0'}</span>
          By Network
        </div>
        <NetworkBreakdown daily={data.daily} />
      </div>

      {/* Top offenders */}
      <div style={{ marginBottom: isMobile ? 24 : 60 }}>
        <div style={SECTION_HEADING}>
          <span style={{ color: '#FF4545', fontSize: 6 }}>{'\u25A0'}</span>
          Worst Offenders
        </div>
        <TopOffenders offenders={data.top_offenders} />
      </div>
    </div>
  );
}
