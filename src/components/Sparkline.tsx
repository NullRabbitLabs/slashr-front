import { useMemo, useState } from 'react';

interface SparklineProps {
  events: { started_at: string; severity?: string }[];
}

const DAYS = 30;
const HEIGHT = 40;
const MIN_BAR_H = 3;

function bucketEvents(events: { started_at: string }[]): number[] {
  const buckets = new Array<number>(DAYS).fill(0);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (const e of events) {
    const eventDate = new Date(e.started_at);
    const eventDayStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
    const daysAgo = Math.floor((todayStart - eventDayStart) / (24 * 60 * 60 * 1000));
    if (daysAgo >= 0 && daysAgo < DAYS) {
      const index = DAYS - 1 - daysAgo;
      buckets[index]!++;
    }
  }

  return buckets;
}

function formatDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function barColor(count: number, max: number): string {
  const intensity = count / max;
  if (intensity >= 0.8) return 'rgba(255, 69, 69, 0.85)';
  if (intensity >= 0.5) return 'rgba(232, 167, 53, 0.80)';
  if (intensity >= 0.25) return 'rgba(255, 255, 255, 0.45)';
  return 'rgba(255, 255, 255, 0.25)';
}

export function Sparkline({ events }: SparklineProps) {
  const buckets = useMemo(() => bucketEvents(events), [events]);
  const max = useMemo(() => Math.max(...buckets, 1), [buckets]);
  const hasAnyBars = buckets.some(c => c > 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!hasAnyBars) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: HEIGHT, marginBottom: 16 }}>
      <svg
        width="100%"
        height={HEIGHT}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {buckets.map((count, i) => {
          if (count === 0) return null;
          const pct = count / max;
          const h = Math.max(pct * HEIGHT, MIN_BAR_H);
          const barW = 100 / DAYS;
          const x = `${i * barW + barW * 0.1}%`;
          const w = `${barW * 0.8}%`;
          return (
            <rect
              key={i}
              x={x}
              y={HEIGHT - h}
              width={w}
              height={h}
              rx={1}
              fill={barColor(count, max)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'default' }}
            >
              <title>
                {formatDate(DAYS - 1 - i)} — {count} incident{count === 1 ? '' : 's'}
              </title>
            </rect>
          );
        })}
      </svg>

      {hoveredIndex != null && buckets[hoveredIndex] != null && buckets[hoveredIndex]! > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: HEIGHT + 4,
            left: `${((hoveredIndex + 0.5) / DAYS) * 100}%`,
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: 'var(--color-text-hover)',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {formatDate(DAYS - 1 - hoveredIndex)} — {buckets[hoveredIndex]} incident{buckets[hoveredIndex] === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}
