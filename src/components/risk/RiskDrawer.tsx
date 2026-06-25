import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RiskValidatorItem } from '@/types/api';
import { formatUsd } from '@/lib/format';
import {
  netColor,
  netTicker,
  recommendationFor,
  signalsFor,
  summaryFor,
  tierColor,
  tierLabel,
  tierSoft,
} from '@/lib/risk';

interface DrawerCtx {
  open: (v: RiskValidatorItem) => void;
  close: () => void;
}

const RiskDrawerContext = createContext<DrawerCtx>({ open: () => {}, close: () => {} });

export function useRiskDrawer(): DrawerCtx {
  return useContext(RiskDrawerContext);
}

export function RiskDrawerProvider({ children }: { children: ReactNode }) {
  const [sel, setSel] = useState<RiskValidatorItem | null>(null);
  const open = useCallback((v: RiskValidatorItem) => setSel(v), []);
  const close = useCallback(() => setSel(null), []);
  const ctx = useMemo(() => ({ open, close }), [open, close]);

  return (
    <RiskDrawerContext.Provider value={ctx}>
      {children}
      {sel && <RiskDrawer sel={sel} onClose={close} />}
    </RiskDrawerContext.Provider>
  );
}

const label: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--text-3)',
  marginBottom: 6,
};

function RiskDrawer({ sel, onClose }: { sel: RiskValidatorItem; onClose: () => void }) {
  const navigate = useNavigate();
  const col = tierColor(sel.tier);
  const soft = tierSoft(sel.tier);
  const signals = signalsFor(sel);
  const moniker = sel.moniker || sel.address;

  const stats: Array<{ label: string; value: string; color?: string }> = [
    { label: 'Value at risk', value: formatUsd(sel.value_at_risk_usd) },
    { label: 'Total staked', value: formatUsd(sel.stake_usd) },
    { label: 'Uptime (30d)', value: sel.uptime_30d != null ? `${sel.uptime_30d.toFixed(2)}%` : '—' },
    {
      label: 'Slashing events',
      value: String(sel.slashing_count),
      color: sel.slashing_count > 0 ? 'var(--crit)' : 'var(--text)',
    },
    { label: 'Incidents (30d)', value: String(sel.incident_count_30d) },
    {
      label: 'Commission',
      value: sel.commission_pct != null ? `${sel.commission_pct}%` : '—',
      color: (sel.commission_pct ?? 0) >= 50 ? 'var(--crit)' : 'var(--text)',
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(8,11,18,.4)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: '92vw',
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          overflowY: 'auto',
          animation: 'slashr-slide-in .26s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {/* header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 2,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: netColor(sel.network) }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {moniker}
            </div>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, color: 'var(--text-3)' }}>
              {sel.address} · {netTicker(sel.network)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontSize: 16,
              flex: 'none',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 22 }}>
          {/* score hero */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: 18,
              background: 'var(--surface-2)',
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: '50%',
                background: `conic-gradient(${col} ${sel.risk_score * 3.6}deg, var(--track) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {sel.risk_score}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '.06em' }}>/ 100</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                Risk tier
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: col, marginBottom: 8 }}>{tierLabel(sel.tier)}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--text-2)' }}>{summaryFor(sel.risk_score)}</div>
            </div>
          </div>

          {/* key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {stats.map(s => (
              <div key={s.label} style={{ border: '1px solid var(--border)', borderRadius: 11, padding: '13px 14px' }}>
                <div style={label}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.color ?? 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* signal breakdown */}
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Risk signal breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
            {signals.map(sig => (
              <div key={sig.label}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{sig.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600, color: sig.color, fontVariantNumeric: 'tabular-nums' }}>
                    {sig.valLabel}
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'var(--track)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${sig.pct}%`, background: sig.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* recommendation */}
          <div style={{ border: `1px solid ${col}`, borderRadius: 12, padding: 15, background: soft }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: col, marginBottom: 6, letterSpacing: '.02em' }}>RECOMMENDATION</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text)' }}>{recommendationFor(sel.risk_score)}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={() => navigate(`/alerts?address=${encodeURIComponent(sel.address)}&chain=${sel.network}`)}
              style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 9, cursor: 'pointer' }}
            >
              Add to watchlist
            </button>
            <button
              onClick={() => navigate(`/validator/${sel.network}/${encodeURIComponent(sel.address)}`)}
              style={{ flex: 1, padding: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer' }}
            >
              View incidents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
