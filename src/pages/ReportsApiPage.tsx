import { useNavigate } from 'react-router-dom';

const ENDPOINTS = [
  { method: 'GET', path: '/v1/risk/validators', desc: 'Ranked risk index', accent: true },
  { method: 'GET', path: '/v1/validators/{network}/{address}', desc: 'Single validator profile', accent: true },
  { method: 'GET', path: '/v1/events', desc: 'Live + historical events', accent: true },
  { method: 'GET', path: '/v1/stats', desc: 'Network incident stats', accent: true },
];

const DELIVERIES = [
  { tag: 'API', title: 'REST', desc: 'Query risk scores and incidents in real time with API keys and rate limits.' },
  { tag: 'WH', title: 'Webhooks', desc: 'Push alerts to Slack, Telegram, or your systems when a validator crosses a threshold.' },
  { tag: 'CSV', title: 'Exports', desc: 'On-demand CSV exports of the risk index for your data warehouse.' },
];

const REPORTS = [
  { title: 'Weekly risk digest', desc: 'Top movers, new critical validators, and network-level summaries.', freq: 'Every Monday', format: 'PDF' },
  { title: 'Underwriting snapshot', desc: 'Full risk profile of a validator set for coverage decisions.', freq: 'On demand', format: 'CSV' },
  { title: 'Treasury exposure', desc: 'Value-at-risk rollup across your delegated stake and operators.', freq: 'Daily', format: 'JSON' },
];

const API_STATS = [
  { label: 'Networks tracked', value: '8' },
  { label: 'Event types', value: '17' },
  { label: 'API version', value: 'v1' },
  { label: 'Auth', value: 'Self-serve keys' },
];

const CODE = `{
  "validator": "Alpha Pro",
  "network": "solana",
  "risk_score": 92,
  "tier": "critical",
  "value_at_risk_usd": 1420000,
  "slashing_count": 2
}`;

export default function ReportsApiPage() {
  const navigate = useNavigate();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 600 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 11 }}>Developers &amp; data</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)', margin: '0 0 10px' }}>Reports &amp; API</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
            Pull Slashr risk data into your own monitoring and treasury systems — REST, webhooks, and scheduled exports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
          <button onClick={() => navigate('/developers')} style={{ height: 40, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 16px', cursor: 'pointer' }}>API reference</button>
          <button onClick={() => navigate('/developers')} style={{ height: 40, fontSize: 13, fontWeight: 600, color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(47,107,255,.3)' }}>Get API key</button>
        </div>
      </div>

      {/* trust strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', marginBottom: 20, overflow: 'hidden' }}>
        {API_STATS.map((s, i) => (
          <div key={s.label} style={{ padding: '18px 22px', borderRight: i < API_STATS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 7 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rd-2col" style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* endpoints + code */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '17px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>REST endpoints</div>
                <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>https://api.slashr.dev</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--ok)', background: 'var(--ok-soft)', padding: '4px 11px', borderRadius: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />v1
              </span>
            </div>
            {ENDPOINTS.map(ep => (
              <div key={ep.path} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '4px 0', width: 50, textAlign: 'center', borderRadius: 6, flex: 'none' }}>{ep.method}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12.5, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.path}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{ep.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#0f1320', border: '1px solid #1c2235', borderRadius: 16, boxShadow: '0 4px 16px rgba(8,11,18,.18)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 18px', borderBottom: '1px solid #1c2235' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', color: '#7cc4ff', background: 'rgba(124,196,255,.13)', padding: '4px 9px', borderRadius: 6 }}>GET</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: '#aab4c8' }}>/v1/risk/validators</span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#8ee0a1' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8ee0a1' }} />200 OK
              </span>
            </div>
            <pre style={{ padding: '17px 20px', margin: 0, fontFamily: "'Geist Mono', monospace", fontSize: 12.5, lineHeight: 1.8, color: '#c7d0e0', overflowX: 'auto' }}>{CODE}</pre>
          </div>
        </div>

        {/* delivery / CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>Delivery</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {DELIVERIES.map(d => (
                <div key={d.tag} style={{ display: 'flex', gap: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: 11, letterSpacing: '.02em' }}>{d.tag}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{d.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3, lineHeight: 1.45 }}>{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--accent)', borderRadius: 16, padding: 22, color: '#fff', boxShadow: '0 8px 24px rgba(47,107,255,.32)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 8 }}>Risk data, programmatically</div>
            <p style={{ fontSize: 13, lineHeight: 1.55, margin: '0 0 18px', opacity: 0.92 }}>
              Historical risk scores, slashing events, and incident data for risk and treasury teams.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/developers')} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: '#fff', border: 'none', padding: '10px 17px', borderRadius: 10, cursor: 'pointer' }}>Get in touch</button>
              <span style={{ fontSize: 11.5, fontWeight: 500, opacity: 0.85 }}>Self-serve API keys</span>
            </div>
          </div>
        </div>
      </div>

      {/* scheduled reports */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Scheduled reports</div>
          <button onClick={() => navigate('/reports/providers')} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Provider reports →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {REPORTS.map(r => (
            <div key={r.title} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em', color: 'var(--text-2)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 5 }}>{r.format}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.freq}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{r.title}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-2)' }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
