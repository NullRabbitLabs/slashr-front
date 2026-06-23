import { useMemo, useState } from 'react';
import { useRiskValidators } from '@/hooks/useRiskValidators';
import { useRiskDrawer } from '@/components/risk/RiskDrawer';
import { NetPills } from '@/components/risk/NetPills';
import { formatUsd } from '@/lib/format';
import { netColor, netTicker, statusMeta, tierColor, tierLabel, tierSoft } from '@/lib/risk';

const GRID = 'minmax(220px,2fr) 90px 140px 110px 110px 120px';

export default function ValidatorsPage() {
  const [net, setNet] = useState('all');
  const [query, setQuery] = useState('');
  const { open } = useRiskDrawer();
  const { validators, loading, error } = useRiskValidators(net);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return validators
      .filter(v => !q || (v.moniker ?? '').toLowerCase().includes(q) || v.address.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => (b.stake_usd ?? 0) - (a.stake_usd ?? 0));
  }, [validators, query]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', margin: '0 0 4px' }}>Validator directory</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          All tracked validators with stake, performance, and current risk status. Click any row for the full risk profile.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <NetPills value={net} onChange={setNet} />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 11px', height: 36, width: 240 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search validator or address" style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', fontSize: 13, color: 'var(--text)', width: '100%' }} />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 16, padding: '14px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          <span>Validator</span>
          <span>Network</span>
          <span style={{ textAlign: 'right' }}>Total staked</span>
          <span style={{ textAlign: 'right' }}>Uptime 30d</span>
          <span style={{ textAlign: 'right' }}>Risk</span>
          <span style={{ textAlign: 'right' }}>Status</span>
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading validators…</div>}
        {error && <div style={{ padding: 40, textAlign: 'center', color: 'var(--crit)', fontSize: 13 }}>Couldn’t load validators — retrying.</div>}
        {!loading && !error && rows.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No validators match.</div>}

        <div>
          {rows.map(v => {
            const sm = statusMeta(v.status);
            return (
              <div
                key={`${v.network}-${v.address}`}
                className="risk-row"
                onClick={() => open(v)}
                style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: 16, padding: '16px 22px', borderBottom: '1px solid var(--border)', boxShadow: `inset 3px 0 0 ${tierColor(v.tier)}` }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.moniker || v.address}</div>
                  <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-3)' }}>{v.address}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: netColor(v.network) }} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{netTicker(v.network)}</span>
                </div>
                <span style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{formatUsd(v.stake_usd)}</span>
                <span style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{v.uptime_30d != null ? `${v.uptime_30d.toFixed(1)}%` : '—'}</span>
                <span style={{ textAlign: 'right', fontSize: 11, fontWeight: 600, justifySelf: 'end', padding: '3px 9px', borderRadius: 20, color: tierColor(v.tier), background: tierSoft(v.tier) }}>{v.risk_score} · {tierLabel(v.tier)}</span>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: sm.color }} />
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{sm.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
