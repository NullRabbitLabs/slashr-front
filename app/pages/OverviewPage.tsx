import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import type { EventType, StatsResponse, RiskListResponse, EventListItem } from '@/types/api';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useStats } from '@/hooks/useStats';
import { useEvents } from '@/hooks/useEvents';
import { useRiskValidators } from '@/hooks/useRiskValidators';
import { useRiskDrawer } from '@/components/risk/RiskDrawer';
import { NETWORK_META, NETWORK_ORDER, EVENT_TYPE_LABELS } from '@/lib/constants';
import { formatUsd } from '@/lib/format';
import { relativeTime } from '@/lib/time';
import { netColor, netTicker, tierColor, tierLabel, tierSoft } from '@/lib/risk';

interface OverviewPageProps {
  initialStats?: StatsResponse | null;
  initialRisk?: RiskListResponse | null;
  initialEvents?: { events: EventListItem[]; hasMore: boolean; cursor: string | null } | null;
}

export default function OverviewPage({ initialStats, initialRisk, initialEvents }: OverviewPageProps = {}) {
  const navigate = useNavigate();
  const { open } = useRiskDrawer();
  const { stats } = useStats(initialStats);
  const { validators } = useRiskValidators('all', 200, initialRisk);
  const { events } = useEvents({ network: null, search: '', initialData: initialEvents });

  usePageMeta({
    title: 'Slashr · Validator Risk Index & Live Slashing Feed',
    description:
      'Track validator slashing, downtime, and commission risk across Solana, Ethereum, Sui, and Cosmos. The Slashr Risk Index scores every validator 0–100.',
  });

  const countByNet = new Map(stats?.networks.map(n => [n.slug, n.counts.last_30d]) ?? []);
  const topRisk = validators.slice(0, 8);
  const recent = events.slice(0, 8);

  const metrics = useMemo(() => {
    const crit = validators.filter(v => v.tier === 'critical').length;
    const varTotal = validators.reduce((s, v) => s + (v.value_at_risk_usd ?? 0), 0);
    return [
      { label: 'Incidents · 30d', value: (stats?.totals.last_30d ?? 0).toLocaleString(), color: 'var(--text)' },
      { label: 'Critical-risk validators', value: String(crit), color: crit > 0 ? 'var(--crit)' : 'var(--text)' },
      { label: 'Stake value at risk', value: formatUsd(varTotal), color: 'var(--text)' },
      { label: 'Networks monitored', value: String(stats?.networks.length || NETWORK_ORDER.length), color: 'var(--text)' },
    ];
  }, [validators, stats]);

  const explore = [
    { title: 'Slashr Risk Index', desc: 'Every tracked validator ranked 0–100 by risk, with stake at risk and incident trend.', cta: 'Open Risk index', path: '/risk' },
    { title: 'Live incident feed', desc: 'Downtime, slashing, and commission events across every network as they happen.', cta: 'Open Live feed', path: '/feed' },
    { title: 'Reports & API', desc: 'Pull risk scores and incidents into your own monitoring and treasury systems.', cta: 'View the API', path: '/reports' },
  ];

  return (
    <div>
      {/* hero */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 26 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
            Validator risk intelligence
          </div>
          <h1 className="rd-hero-headline" style={{ fontSize: 32, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-.025em', color: 'var(--text)', margin: '0 0 12px', whiteSpace: 'nowrap' }}>
            Know which validators put stake at risk before they do.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-2)', margin: 0 }}>
            Continuous slashing, downtime, and commission monitoring across every network we track, for staking
            operators, risk teams, and treasury desks who want the data behind the feed.
          </p>
        </div>
      </div>

      {/* summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 18 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12 }}>{m.label}</div>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.025em', color: m.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* network strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 10, marginBottom: 18 }}>
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

      <div className="rd-2col" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, marginBottom: 18 }}>
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
            {topRisk.map(v => (
              <Link
                key={`${v.network}-${v.address}`}
                to={`/validator/${v.network}/${encodeURIComponent(v.address)}`}
                className="risk-row"
                onClick={e => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                  e.preventDefault();
                  open(v);
                }}
                style={{ display: 'grid', gridTemplateColumns: '26px 1fr 76px 90px', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--border)', boxShadow: `inset 3px 0 0 ${tierColor(v.tier)}`, textDecoration: 'none', color: 'inherit' }}
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
              </Link>
            ))}
            {topRisk.length === 0 && <div style={{ padding: 24, fontSize: 13, color: 'var(--text-3)' }}>No ranked validators yet.</div>}
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

      {/* explore band */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {explore.map(c => (
          <Link
            key={c.path}
            to={c.path}
            className="risk-row"
            style={{ display: 'block', textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow)', padding: '18px 20px', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{c.title}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-2)', marginBottom: 14 }}>{c.desc}</div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>{c.cta} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
