import { useMemo, useState } from 'react';
import type { DowBucket } from '@/types/api';

interface DowChartProps {
  data: DowBucket[];
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HEIGHT = 56;
const LABEL_H = 16;
const TOTAL_H = HEIGHT + LABEL_H;

function barColor(intensity: number): string {
  if (intensity >= 0.8) return 'rgba(255, 69, 69, 0.90)';
  if (intensity >= 0.5) return 'rgba(255, 69, 69, 0.55)';
  if (intensity >= 0.25) return 'rgba(255, 69, 69, 0.30)';
  return 'rgba(255, 69, 69, 0.15)';
}

export function DowChart({ data }: DowChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = useMemo(() => Math.max(...data.map(d => d.event_count), 1), [data]);

  const barW = 100 / 7;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="100%"
        height={TOTAL_H}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {data.map((d, i) => {
          const pct = d.event_count / max;
          const h = Math.max(pct * HEIGHT, d.event_count > 0 ? 2 : 0.5);
          const x = `${i * barW + barW * 0.1}%`;
          const w = `${barW * 0.8}%`;
          const isHovered = hovered === i;

          return (
            <g key={i}>
              <rect
                x={x}
                y={HEIGHT - h}
                width={w}
                height={h}
                fill={d.event_count > 0 ? barColor(pct) : 'rgba(255,255,255,0.04)'}
                opacity={isHovered ? 1 : 0.85}
                style={{ shapeRendering: 'crispEdges' }}
              />
              {/* Hit area */}
              <rect
                x={`${i * barW}%`}
                y={0}
                width={`${barW}%`}
                height={HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'crosshair' }}
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {DAYS.map((label, i) => (
          <text
            key={i}
            x={`${i * barW + barW / 2}%`}
            y={HEIGHT + 14}
            textAnchor="middle"
            style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fill: hovered === i ? 'var(--color-text-secondary)' : 'var(--color-text-ghost)',
            }}
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && data[hovered] && (
        <div
          style={{
            position: 'absolute',
            left: `${(hovered * barW + barW / 2)}%`,
            top: -4,
            transform: 'translate(-50%, -100%)',
            background: '#0a0a0b',
            border: '1px solid rgba(255,69,69,0.3)',
            padding: '4px 8px',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#fff',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{DAYS[hovered]}</span>
          {' '}
          <span style={{ color: '#FF4545' }}>{data[hovered]!.event_count}</span>
        </div>
      )}
    </div>
  );
}
