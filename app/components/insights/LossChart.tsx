import { useMemo, useState, useCallback } from 'react';
import type { DailyInsight, NetworkSlug } from '@/types/api';
import { NETWORK_META, NETWORK_ORDER } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatUsd } from '@/lib/format';

interface LossChartProps {
  daily: DailyInsight[];
  mode: 'daily' | 'cumulative';
}

const HEIGHT = 180;
const MOBILE_HEIGHT = 140;
const Y_LABEL_W = 56;
const X_LABEL_H = 22;

function formatAxis(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return '$0';
}

export function LossChart({ daily, mode }: LossChartProps) {
  const isMobile = useIsMobile();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartH = (isMobile ? MOBILE_HEIGHT : HEIGHT);
  const totalH = chartH + X_LABEL_H;

  const { bars, maxVal, xLabels } = useMemo(() => {
    if (daily.length === 0) return { bars: [], maxVal: 0, xLabels: [] };

    const activeNetworks = NETWORK_ORDER.filter(slug =>
      daily.some(d => d.by_network.some(n => n.slug === slug && n.loss_usd > 0))
    );

    let cumulative = 0;
    const cumByNetwork: Record<string, number> = {};

    const processed = daily.map(d => {
      const networkLosses: { slug: NetworkSlug; value: number }[] = [];

      for (const slug of activeNetworks) {
        const net = d.by_network.find(n => n.slug === slug);
        const loss = net?.loss_usd ?? 0;

        if (mode === 'cumulative') {
          cumByNetwork[slug] = (cumByNetwork[slug] ?? 0) + loss;
          networkLosses.push({ slug, value: cumByNetwork[slug] });
        } else {
          networkLosses.push({ slug, value: loss });
        }
      }

      if (mode === 'cumulative') {
        cumulative += d.loss_usd;
      }

      return {
        date: d.date,
        total: mode === 'cumulative' ? cumulative : d.loss_usd,
        networks: networkLosses,
        raw: d,
      };
    });

    const maxVal = Math.max(...processed.map(b => b.total), 1);

    const labelInterval = Math.max(1, Math.floor(daily.length / (isMobile ? 4 : 6)));
    const xLabels = processed
      .filter((_, i) => i % labelInterval === 0 || i === processed.length - 1)
      .map(b => ({
        date: b.date,
        idx: processed.indexOf(b),
      }));

    return { bars: processed, maxVal, xLabels };
  }, [daily, mode, isMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - Y_LABEL_W;
    const chartWidth = rect.width - Y_LABEL_W;
    if (x < 0 || x > chartWidth) { setHoveredIdx(null); return; }
    const idx = Math.floor((x / chartWidth) * bars.length);
    setHoveredIdx(Math.min(idx, bars.length - 1));
  }, [bars.length]);

  if (bars.length === 0) return null;

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => (maxVal / gridLines) * i);
  const barPct = 100 / bars.length;

  return (
    <div
      style={{ position: 'relative', display: 'flex' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {/* Y-axis labels */}
      <div style={{ width: Y_LABEL_W, flexShrink: 0, position: 'relative', height: totalH }}>
        {gridValues.map((val, i) => {
          const top = chartH - (val / maxVal) * chartH;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: top - 6,
                right: 6,
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-text-ghost)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatAxis(val)}
            </div>
          );
        })}
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, position: 'relative', height: totalH }}>
        {/* Grid lines */}
        {gridValues.map((val, i) => {
          const top = chartH - (val / maxVal) * chartH;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: 1,
                background: 'rgba(255,255,255,0.06)',
              }}
            />
          );
        })}

        {/* Bars via SVG */}
        <svg
          width="100%"
          height={chartH}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {bars.map((bar, i) => {
            const isHovered = hoveredIdx === i;
            let yOffset = 0;
            const segments = [...bar.networks].reverse();

            return (
              <g key={i}>
                {segments.map((seg, si) => {
                  const segH = (seg.value / maxVal) * chartH;
                  const meta = NETWORK_META[seg.slug];
                  const y = chartH - yOffset - segH;
                  if (mode !== 'cumulative') yOffset += segH;
                  else yOffset = Math.max(yOffset, segH);

                  return (
                    <rect
                      key={si}
                      x={`${i * barPct + barPct * 0.1}%`}
                      y={y}
                      width={`${barPct * 0.8}%`}
                      height={Math.max(segH, 0)}
                      fill={meta?.color ?? '#888'}
                      opacity={isHovered ? 0.95 : mode === 'cumulative' ? 0.6 : 0.75}
                      shapeRendering="crispEdges"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Hover crosshair */}
          {hoveredIdx !== null && (
            <line
              x1={`${hoveredIdx * barPct + barPct / 2}%`}
              x2={`${hoveredIdx * barPct + barPct / 2}%`}
              y1={0}
              y2={chartH}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
              strokeDasharray="2 2"
              shapeRendering="crispEdges"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* X-axis labels (HTML for crisp text) */}
        <div style={{ height: X_LABEL_H, position: 'relative' }}>
          {xLabels.map((label, i) => {
            const left = `${(label.idx / bars.length) * 100 + barPct / 2}%`;
            const dateObj = new Date(label.date + 'T00:00:00');
            const display = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left,
                  top: 6,
                  transform: 'translateX(-50%)',
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--color-text-ghost)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {display}
              </span>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredIdx !== null && bars[hoveredIdx] && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredIdx * barPct + barPct / 2)}%`,
              top: 0,
              transform: 'translateX(-50%)',
              background: '#0a0a0b',
              border: '1px solid rgba(255,69,69,0.3)',
              padding: '8px 12px',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#fff',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{bars[hoveredIdx].date}</div>
            <div style={{ marginBottom: 4 }}>
              {mode === 'daily' ? 'day' : 'cumul'}: <span style={{ color: '#FF4545' }}>{formatUsd(bars[hoveredIdx].total)}</span>
            </div>
            {bars[hoveredIdx].raw.by_network
              .filter(n => n.loss_usd > 0)
              .sort((a, b) => b.loss_usd - a.loss_usd)
              .map(n => (
                <div key={n.slug} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    background: NETWORK_META[n.slug]?.color ?? '#888',
                  }} />
                  <span style={{ color: 'var(--color-text-dim)' }}>
                    {NETWORK_META[n.slug]?.ticker ?? n.slug}
                  </span>
                  <span>{formatUsd(n.loss_usd)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
