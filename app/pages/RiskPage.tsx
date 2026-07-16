import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { RiskListResponse, RiskTier, RiskValidatorItem } from '@/types/api';
import { useRiskValidators } from '@/hooks/useRiskValidators';
import { useRiskDrawer } from '@/components/risk/RiskDrawer';
import { NetPills } from '@/components/risk/NetPills';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useJsonLd } from '@/hooks/useJsonLd';
import { formatUsd } from '@/lib/format';
import { netColor, sparkPoints, tierColor, tierLabel, tierSoft } from '@/lib/risk';

const RISK_DATASET = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Slashr Risk Index',
  description:
    'A per-validator 0–100 risk score across Solana, Ethereum, Sui, and Cosmos, a transparent composite of downtime, slashing history, commission behavior, and infrastructure health.',
  url: 'https://slashr.dev/risk',
  keywords: ['validator risk', 'validator slashing', 'staking risk', 'validator integrity', 'delegation risk'],
  isAccessibleForFree: true,
  creator: { '@type': 'Organization', name: 'NullRabbit', url: 'https://nullrabbit.ai' },
  variableMeasured: [
    'risk score (0–100)',
    'incidents (30d)',
    'slashing events (30d)',
    'stake (USD)',
    'commission (%)',
  ],
};

const GRID = '50px minmax(220px,1.6fr) 188px 124px 130px 108px 80px 116px';

type SortKey = 'rank' | 'name' | 'score' | 'inc30' | 'var' | 'uptime' | 'slashing' | 'comm';

const COLUMNS: Array<{ key: SortKey; label: string; align: 'left' | 'right'; sortable: boolean }> = [
  { key: 'rank', label: '#', align: 'left', sortable: false },
  { key: 'name', label: 'Validator', align: 'left', sortable: true },
  { key: 'score', label: 'Risk score', align: 'left', sortable: true },
  { key: 'inc30', label: 'Incidents 30d', align: 'left', sortable: true },
  { key: 'var', label: 'Stake (USD)', align: 'right', sortable: true },
  { key: 'uptime', label: 'Uptime 30d', align: 'right', sortable: false },
  { key: 'slashing', label: 'Slashes', align: 'right', sortable: true },
  { key: 'comm', label: 'Commission', align: 'right', sortable: false },
];

const TIERS: Array<{ tier: RiskTier; label: string; range: string }> = [
  { tier: 'critical', label: 'Critical', range: '75+' },
  { tier: 'elevated', label: 'Elevated', range: '60–74' },
  { tier: 'moderate', label: 'Moderate', range: '40–59' },
  { tier: 'low', label: 'Low', range: '0–39' },
];

function downloadCsv(rows: RiskValidatorItem[]) {
  const header = ['rank', 'network', 'address', 'moniker', 'risk_score', 'tier', 'stake_usd', 'value_at_risk_usd', 'slashes_principal', 'incident_count_30d', 'slashing_count', 'commission_pct'];
  const lines = rows.map(r =>
    [r.rank, r.network, r.address, r.moniker ?? '', r.risk_score, r.tier, r.stake_usd ?? '', r.value_at_risk_usd ?? '', r.slashes_principal ?? '', r.incident_count_30d, r.slashing_count, r.commission_pct ?? ''].join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'slashr-risk-index.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function RiskPage({ initialRisk }: { initialRisk?: RiskListResponse | null } = {}) {
  const [net, setNet] = useState('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { open } = useRiskDrawer();
  const { validators, loading, error } = useRiskValidators(net, 200, initialRisk);

  usePageMeta({
    title: 'Slashr Risk Index · Validator Risk Scores (0–100)',
    description:
      'An independent 0–100 risk score for every validator we track across Solana, Ethereum, Sui, and Cosmos, a composite of downtime, slashing history, commission, and infrastructure health.',
  });
  useJsonLd(RISK_DATASET);

  const metrics = useMemo(() => {
    const crit = validators.filter(v => v.risk_score >= 75).length;
    const varTotal = validators.reduce((s, v) => s + (v.value_at_risk_usd ?? 0), 0);
    const slashTotal = validators.reduce((s, v) => s + v.slashing_count, 0);
    return [
      { label: 'Validators tracked', value: String(validators.length), sub: 'with recent incidents', color: 'var(--text)' },
      { label: 'Critical-risk validators', value: String(crit), sub: 'score 75+ · judgement band, not calibrated', color: 'var(--crit)' },
      { label: 'Delegated stake · listed validators', value: formatUsd(varTotal), sub: 'stake associated with listed validators - not expected loss', color: 'var(--text)' },
      { label: 'Slashing events', value: String(slashTotal), sub: 'confirmed on-chain · 30d', color: 'var(--text)' },
    ];
  }, [validators]);

  const distribution = useMemo(() => {
    const total = validators.length || 1;
    return TIERS.map(t => {
      const count = validators.filter(v => v.tier === t.tier).length;
      return { ...t, count, pct: `${((count / total) * 100).toFixed(2)}%` };
    });
  }, [validators]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = validators.filter(
      v => !q || (v.moniker ?? '').toLowerCase().includes(q) || v.address.toLowerCase().includes(q),
    );
    const dir = sortDir === 'desc' ? -1 : 1;
    const keyf: Record<SortKey, (v: RiskValidatorItem) => number | string> = {
      rank: v => v.rank,
      name: v => (v.moniker ?? v.address).toLowerCase(),
      score: v => v.risk_score,
      inc30: v => v.incident_count_30d,
      var: v => v.value_at_risk_usd ?? 0,
      uptime: v => v.uptime_30d ?? 0,
      slashing: v => v.slashing_count,
      comm: v => v.commission_pct ?? 0,
    };
    const kf = keyf[sortKey];
    list = [...list].sort((a, b) => {
      const x = kf(a);
      const y = kf(b);
      if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y) * dir;
      return ((x as number) - (y as number)) * dir;
    });
    return list;
  }, [validators, query, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  };

  return (
    <div>
      {/* hero + distribution */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 36, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 11 }}>
            Risk analytics
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)', margin: '0 0 10px' }}>
            Slashr Risk Index
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
            A risk score for every validator we track - a transparent composite of incident frequency (including slashing
            events), downtime, recovery speed, repeat-failure patterns, and infrastructure health. Scores describe observed
            behaviour; they are not predictions and do not measure expected loss.{' '}
            <Link to="/methodology" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>How the score works →</Link>
          </p>
        </div>
        <div style={{ width: 320, maxWidth: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Risk distribution</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)', animation: 'slashr-pulse 2.4s ease-in-out infinite' }} />
              Live
            </span>
          </div>
          <div style={{ display: 'flex', height: 9, borderRadius: 5, overflow: 'hidden', background: 'var(--track)', marginBottom: 15 }}>
            {distribution.map(t => (
              <div key={t.tier} style={{ width: t.pct, background: tierColor(t.tier) }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
            {distribution.map(t => (
              <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: tierColor(t.tier), flex: 'none' }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{t.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 26 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 16 }}>{m.label}</div>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.025em', color: m.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{m.value}</span>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <NetPills value={net} onChange={setNet} />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', height: 38, width: 260 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search validator or address"
            style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', fontSize: 13, color: 'var(--text)', width: '100%' }}
          />
        </div>
        <button
          onClick={() => downloadCsv(rows)}
          style={{ height: 38, display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 14px', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
          Export CSV
        </button>
      </div>

      {/* table */}
      <div className="rd-table-scroll">
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden', minWidth: 900 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: 18, padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {COLUMNS.map(c => {
            const active = c.sortable && sortKey === c.key;
            return (
              <button
                key={c.key}
                onClick={c.sortable ? () => onSort(c.key) : undefined}
                style={{
                  font: 'inherit',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: c.sortable ? 'pointer' : 'default',
                  textAlign: c.align,
                  justifySelf: c.align === 'right' ? 'end' : 'start',
                }}
              >
                {c.label}
                {active ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
            );
          })}
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading risk index…</div>}
        {error && <div style={{ padding: 40, textAlign: 'center', color: 'var(--crit)', fontSize: 13 }}>Couldn’t load the risk index. Retrying.</div>}
        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No validators match.</div>
        )}

        <div>
          {rows.map(v => (
            <Link
              key={`${v.network}-${v.address}`}
              to={`/validator/${v.network}/${encodeURIComponent(v.address)}`}
              className="risk-row"
              onClick={e => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                open(v);
              }}
              style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: 18, padding: '18px 24px', borderBottom: '1px solid var(--border)', boxShadow: `inset 3px 0 0 ${tierColor(v.tier)}`, textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{v.rank}</span>

              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: netColor(v.network), flex: 'none' }} />
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.moniker || v.address}</span>
                </div>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>{v.address}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', width: 28 }}>{v.risk_score}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.02em', padding: '3px 9px', borderRadius: 20, color: tierColor(v.tier), background: tierSoft(v.tier) }}>{tierLabel(v.tier)}</span>
                </div>
                <div style={{ width: '100%', height: 4, borderRadius: 3, background: 'var(--track)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${v.risk_score}%`, background: tierColor(v.tier) }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="58" height="22" viewBox="0 0 84 22" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <polyline points={sparkPoints(v.spark)} fill="none" stroke={tierColor(v.tier)} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{v.incident_count_30d}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{formatUsd(v.value_at_risk_usd)}</span>
                {v.slashes_principal != null && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {v.slashes_principal ? 'principal slashable' : 'no principal slashing'}
                  </span>
                )}
              </div>
              <span style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{v.uptime_30d != null ? `${v.uptime_30d.toFixed(1)}%` : '-'}</span>
              <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: v.slashing_count > 0 ? 'var(--crit)' : 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{v.slashing_count}</span>
              <span style={{ textAlign: 'right', fontSize: 13, color: (v.commission_pct ?? 0) >= 50 ? 'var(--crit)' : 'var(--text-2)', fontWeight: (v.commission_pct ?? 0) >= 50 ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
                {v.commission_pct != null ? `${v.commission_pct}%` : '-'}
              </span>
            </Link>
          ))}
        </div>
      </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Showing {rows.length} tracked validators</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Scores recalculated continuously · tiers are judgement bands, not calibrated to outcomes ·{' '}
          <Link to="/methodology" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Methodology</Link>
        </div>
      </div>
    </div>
  );
}
