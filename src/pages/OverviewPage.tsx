import { useNavigate } from 'react-router-dom';
import type { EventType } from '@/types/api';
import { useStats } from '@/hooks/useStats';
import { useEvents } from '@/hooks/useEvents';
import { useRiskValidators } from '@/hooks/useRiskValidators';
import { useRiskDrawer } from '@/components/risk/RiskDrawer';
import { NETWORK_META, NETWORK_ORDER, EVENT_TYPE_LABELS } from '@/lib/constants';
import { formatUsd } from '@/lib/format';
import { relativeTime } from '@/lib/time';
import { netColor, netTicker, tierColor, tierLabel, tierSoft } from '@/lib/risk';

export default function OverviewPage() {
  const navigate = useNavigate();
  const { open } = useRiskDrawer();
  const { stats } = useStats();
  const { validators } = useRiskValidators('all', 6);
  const { events } = useEvents({ network: null, search: '' });

  const countByNet = new Map(stats?.networks.map(n => [n.slug, n.counts.last_30d]) ?? []);
  const recent = events.slice(0, 5);

  return (
    <div>
      {/* hero */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 26 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
            Validator risk intelligence
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-.025em', color: 'var(--text)', margin: '0 0 12px', whiteSpace: 'nowrap' }}>
            Know which validators put stake at risk — before they do.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-2)', margin: 0, maxWidth: 720, textWrap: 'pretty' }}>
            Continuous slashing, downtime, and commission monitoring across every network we track — for staking
            operators, risk teams, and treasury desks who want the data behind the feed.
          </p>
        </div>
      </div>

      {/* network strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 10, marginBottom: 28 }}>
        {NETWORK_ORDER.map(slug => (
          <div key={slug} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 14px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: NETWORK_META[slug].color }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{NETWORK_META[slug].ticker}</span>
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {(countByNet.get(slug) ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>incidents / 30d</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        {/* top risk preview */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Highest-risk validators</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Ranked by Slashr Risk Index</div>
            </div>
            <button onClick={() => navigate('/risk')} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Open Risk index →
            </button>
          </div>
          <div>
            {validators.map(v => (
              <div
                key={`${v.network}-${v.address}`}
                className="risk-row"
                onClick={() => open(v)}
                style={{ display: 'grid', gridTemplateColumns: '26px 1fr 76px 90px', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--border)', boxShadow: `inset 3px 0 0 ${tierColor(v.tier)}` }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{v.rank}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.moniker || v.address}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: netColor(v.network) }} />
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{netTicker(v.network)} · {formatUsd(v.value_at_risk_usd)} at risk</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, color: tierColor(v.tier), background: tierSoft(v.tier), justifySelf: 'start' }}>{tierLabel(v.tier)}</span>
                <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 42, height: 5, borderRadius: 3, background: 'var(--track)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${v.risk_score}%`, background: tierColor(v.tier) }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', width: 22, textAlign: 'right' }}>{v.risk_score}</span>
                </div>
              </div>
            ))}
            {validators.length === 0 && <div style={{ padding: 24, fontSize: 13, color: 'var(--text-3)' }}>No ranked validators yet.</div>}
          </div>
        </div>

        {/* recent incidents */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Recent incidents</div>
            <button onClick={() => navigate('/feed')} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Live feed →
            </button>
          </div>
          <div>
            {recent.map(e => {
              const color = e.severity === 'critical' ? 'var(--crit)' : e.severity === 'warning' ? 'var(--warn)' : 'var(--text-3)';
              return (
                <div key={e.id} style={{ display: 'flex', gap: 11, padding: '13px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 3, flex: 'none', borderRadius: 3, background: color }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.validator_moniker || e.validator_address}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color, marginLeft: 'auto', flex: 'none' }}>{e.resolved_at ? 'RESOLVED' : 'ONGOING'}</span>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-2)' }}>{EVENT_TYPE_LABELS[e.event_type as EventType] ?? e.event_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>{netTicker(e.network)} · {relativeTime(e.started_at)}</div>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && <div style={{ padding: 24, fontSize: 13, color: 'var(--text-3)' }}>No recent incidents.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
