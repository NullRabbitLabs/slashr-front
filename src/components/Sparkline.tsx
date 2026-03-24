import { useMemo, useState } from 'react';

interface SparklineProps {
  events: { started_at: string }[];
}

const DAYS = 30;
const SVG_W = 300;
const SVG_H = 32;
const BAR_W = 8;
const COL_W = SVG_W / DAYS; // 10

function bucketEvents(events: { started_at: string }[]): number[] {
  const buckets = new Array<number>(DAYS).fill(0);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (const e of events) {
    const eventDate = new Date(e.started_at);
    const eventDayStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
    const daysAgo = Math.floor((todayStart - eventDayStart) / (24 * 60 * 60 * 1000));
    if (daysAgo >= 0 && daysAgo < DAYS) {
      const index = DAYS - 1 - daysAgo; // oldest left, newest right
      buckets[index]!++;
    }
  }

  return buckets;
}

function formatDate(daysFromRight: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysFromRight);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Sparkline({ events }: SparklineProps) {
  const buckets = useMemo(() => bucketEvents(events), [events]);
  const max = useMemo(() => Math.max(...buckets, 1), [buckets]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 16 }}>
      <svg
        width="100%"
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {buckets.map((count, i) => {
          if (count === 0) return null;
          const h = (count / max) * SVG_H;
          return (
            <rect
              key={i}
              x={i * COL_W + (COL_W - BAR_W) / 2}
              y={SVG_H - h}
              width={BAR_W}
              height={h}
              rx={1}
              fill="rgba(255,255,255,0.25)"
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
            bottom: SVG_H + 4,
            left: `${((hoveredIndex + 0.5) / DAYS) * 100}%`,
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
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
