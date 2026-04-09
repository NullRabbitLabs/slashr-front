import { useMemo, useState, useRef, useEffect } from 'react';
import type { DailyInsight } from '@/types/api';
import { formatUsd } from '@/lib/format';

interface HeatmapProps {
  daily: DailyInsight[];
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const WEEKS = 52;
const MONTH_LABEL_H = 16;
const LABEL_W = 32;

function cellColor(count: number, max: number): string {
  if (count === 0) return 'rgba(255,255,255,0.04)';
  const intensity = count / max;
  if (intensity >= 0.7) return 'rgba(255, 69, 69, 0.95)';
  if (intensity >= 0.4) return 'rgba(255, 69, 69, 0.60)';
  if (intensity >= 0.15) return 'rgba(255, 69, 69, 0.35)';
  return 'rgba(255, 69, 69, 0.18)';
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export function Heatmap({ daily }: HeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [hovered, setHovered] = useState<{ date: string; count: number; loss: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { grid, months, max, dataStartDate } = useMemo(() => {
    const map = new Map<string, DailyInsight>();
    for (const d of daily) map.set(d.date, d);

    if (daily.length === 0) return { grid: [], months: [], max: 1, dataStartDate: '' };

    // End at today, start 52 weeks back (like GitHub)
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endMonday = getMonday(endDate);
    // Go back 51 weeks from the end Monday to get 52 columns
    const startMonday = new Date(endMonday);
    startMonday.setDate(startMonday.getDate() - 51 * 7);

    const week0 = startMonday.getTime();
    const cells: { date: string; dayOfWeek: number; week: number; count: number; loss: number; future: boolean }[] = [];
    let maxCount = 1;

    const current = new Date(startMonday);
    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);
      const dayOfWeek = (current.getDay() + 6) % 7;
      const weekNum = Math.floor((current.getTime() - week0) / (7 * 24 * 60 * 60 * 1000));
      const insight = map.get(dateStr);
      const count = insight?.event_count ?? 0;
      const loss = insight?.loss_usd ?? 0;
      if (count > maxCount) maxCount = count;
      cells.push({ date: dateStr, dayOfWeek, week: weekNum, count, loss, future: current > today });
      current.setDate(current.getDate() + 1);
    }

    // Month labels — first Monday of each month
    const monthLabels: { label: string; week: number }[] = [];
    let lastMonth = -1;
    for (const c of cells) {
      const m = new Date(c.date + 'T00:00:00').getMonth();
      if (m !== lastMonth && c.dayOfWeek === 0) {
        monthLabels.push({
          label: new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }),
          week: c.week,
        });
        lastMonth = m;
      }
    }

    const firstDataDate = daily[0]!.date;

    return { grid: cells, months: monthLabels, max: maxCount, dataStartDate: firstDataDate };
  }, [daily]);

  if (grid.length === 0 || containerW === 0) {
    return <div ref={containerRef} style={{ width: '100%', minHeight: 40 }} />;
  }

  // Compute cell size from container width
  const availW = containerW - LABEL_W;
  const step = Math.floor(availW / WEEKS);
  const cell = Math.max(6, step - Math.max(1, Math.round(step * 0.15)));

  const svgW = LABEL_W + WEEKS * step;
  const svgH = MONTH_LABEL_H + 7 * step;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        width={svgW}
        height={svgH}
        style={{ display: 'block' }}
      >
        {/* Month labels */}
        {months.map((m, i) => (
          <text
            key={i}
            x={LABEL_W + m.week * step}
            y={11}
            textAnchor="start"
            style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fill: 'var(--color-text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {m.label}
          </text>
        ))}

        {/* Day labels */}
        {DAY_LABELS.map((label, i) => (
          label ? (
            <text
              key={i}
              x={LABEL_W - 6}
              y={MONTH_LABEL_H + i * step + cell / 2 + 4}
              textAnchor="end"
              style={{
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
                fill: 'var(--color-text-ghost)',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </text>
          ) : null
        ))}

        {/* Cells */}
        {grid.map((c, i) => {
          const x = LABEL_W + c.week * step;
          const y = MONTH_LABEL_H + c.dayOfWeek * step;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cell}
              height={cell}
              fill={c.future ? 'transparent' : cellColor(c.count, max)}
              rx={1}
              style={{ cursor: c.count > 0 ? 'crosshair' : 'default', shapeRendering: 'crispEdges' }}
              onMouseEnter={(e) => {
                if (c.count === 0) return;
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                const cont = containerRef.current?.getBoundingClientRect();
                if (cont) {
                  setHovered({
                    date: c.date,
                    count: c.count,
                    loss: c.loss,
                    x: rect.left - cont.left + cell / 2,
                    y: rect.top - cont.top,
                  });
                }
              }}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      {/* Footer: disclaimer left, legend right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}
      >
        <span style={{
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--color-text-ghost)',
        }}>
          data collection started {dataStartDate}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-ghost)',
            textTransform: 'uppercase',
            marginRight: 3,
          }}>
            less
          </span>
          {[0, 0.15, 0.4, 0.7, 1].map((level, i) => (
            <div
              key={i}
              style={{
                width: cell,
                height: cell,
                borderRadius: 1,
                background: cellColor(Math.ceil(level * max), max),
              }}
            />
          ))}
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-ghost)',
            textTransform: 'uppercase',
            marginLeft: 3,
          }}>
            more
          </span>
        </div>
      </div>

      {/* Tooltip */}
      {hovered && hovered.count > 0 && (
        <div
          style={{
            position: 'absolute',
            left: hovered.x,
            top: hovered.y - 6,
            transform: 'translate(-50%, -100%)',
            background: '#111',
            border: '1px solid rgba(255,69,69,0.3)',
            padding: '6px 10px',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#fff',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{hovered.date}</div>
          <div>
            <span style={{ color: '#FF4545' }}>{hovered.count}</span> event{hovered.count === 1 ? '' : 's'}
            {hovered.loss > 0 && (
              <span style={{ color: 'var(--color-text-dim)', marginLeft: 8 }}>{formatUsd(hovered.loss)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
