import { useNetworks } from '@/hooks/useNetworks';
import { usePageMeta } from '@/hooks/usePageMeta';
import type { NetworkInfo } from '@/types/api';

/**
 * Public methodology for the Slashr Risk Index.
 *
 * Every statement on this page is derived from the actual implementation
 * (slasher-api grading.rs / risk.rs / queries/risk.rs). If the model
 * changes, this page must change with it - it is the falsifiability
 * contract for the score.
 */

const FACTORS: Array<{ name: string; weight: string; how: string }> = [
  {
    name: 'Incident frequency',
    weight: '30%',
    how: 'Operational incidents over the last 90 days. Each incident adds 10 penalty points, capped at 100. Configuration and lifecycle events - MEV client toggles, commission changes, voluntary exits - are not incidents and are excluded from every component below.',
  },
  {
    name: 'Total downtime',
    weight: '25%',
    how: 'Merged operational-incident intervals over 90 days (overlaps are not double-counted). Each hour adds 2 points, capped at 100.',
  },
  {
    name: 'Recovery speed',
    weight: '15%',
    how: 'Average minutes from operational-incident start to resolution. Each 10 minutes adds 1 point, capped at 100.',
  },
  {
    name: 'Infrastructure scan',
    weight: '15%',
    how: 'From NullRabbit’s non-invasive scan of a validator’s publicly-exposed infrastructure: 15 points per known CVE (capped at 60) plus 5 per exposed service / open port (capped at 40). See “What the infrastructure scan reads” below - the scanner IPs are published and an opt-out is available.',
  },
  {
    name: 'Repeat-failure pattern',
    weight: '15%',
    how: 'A flat 80 points if the same operational-incident type occurred 3 or more times in the last 7 days; otherwise 0.',
  },
];

// Mechanism references connect an incident CLASS to NullRabbit's research
// registry (NRDAX) where a documented fault mechanism genuinely corresponds.
// Deliberately class-level and reference-only: a slashing event records that
// a fault occurred on-chain, it does NOT assert the validator exploited any
// technique. Operational and configuration classes have no attack mechanism
// and say so.
const MECHANISM_REFS: Array<{ group: string; classes: string; mechanism: React.ReactNode }> = [
  {
    group: 'Equivocation (double-signing)',
    classes: 'Slashed / double-sign / duplicate-block events on Ethereum, Cosmos, Solana, Celestia, Polkadot',
    mechanism: (
      <>
        A documented consensus fault. NullRabbit catalogues equivocation mechanisms in its research registry -{' '}
        <a href="https://nrdax.com" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>NRDAX</a>.
        A slashing event records that the fault occurred on-chain; it does <em>not</em> indicate the validator
        exploited a technique - most are operator misconfiguration (for example two signing instances running at
        once).
      </>
    ),
  },
  {
    group: 'Downtime & liveness',
    classes: 'Delinquency, jailing/downtime slashes, inactivity leak, uptime kickouts',
    mechanism: <>Availability failures, not exploits. No attack mechanism is implied or established.</>,
  },
  {
    group: 'Configuration & lifecycle',
    classes: 'Commission changes, MEV-client (Jito) toggles, voluntary exits',
    mechanism: <>Operator configuration or protocol-designed events - not incidents, and no mechanism applies.</>,
  },
];

const CORRECTIONS = [
  {
    date: '15 July 2026',
    title: 'Incident classification corrected',
    body:
      'The grade previously counted every published event as an incident, including configuration and lifecycle events - MEV client (Jito) opt-in/opt-out toggles, commission changes, and Ethereum voluntary exits. These are not operational incidents, and on some networks they were the large majority of events. From this date the incident, downtime, recovery, and repeat-failure components count operational incidents only. Scores are recomputed live from event data on every request, so this correction applied to every score at once; earlier scores are not restated as though they were always calculated this way.',
  },
];

const TIER_ROWS = [
  { label: 'Critical', range: '75–100' },
  { label: 'Elevated', range: '60–74' },
  { label: 'Moderate', range: '40–59' },
  { label: 'Low', range: '0–39' },
];

const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '-.02em',
  color: 'var(--text)',
  margin: '36px 0 10px',
};

const p: React.CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.65,
  color: 'var(--text-2)',
  margin: '0 0 12px',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--surface-2)',
};

const td: React.CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'var(--text-2)',
  padding: '12px 14px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
};

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  boxShadow: 'var(--shadow)',
  overflow: 'hidden',
};

export default function MethodologyPage({ initialNetworks }: { initialNetworks?: NetworkInfo[] | null } = {}) {
  const { networks } = useNetworks(initialNetworks);

  usePageMeta({
    title: 'Methodology · Slashr Risk Index',
    description:
      'What goes into the Slashr Risk Index, how each input is weighted, what the score does and does not claim, and per-network loss semantics.',
  });

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 11 }}>
        Methodology
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)', margin: '0 0 10px' }}>
        How the Slashr Risk Index works
      </h1>
      <p style={p}>
        Every validator we track gets a score from 0 to 100, where higher means riskier. The score is fully
        mechanical: it is the inverse of an internal operational health grade, recomputed continuously from the
        published events and infrastructure scans you can see on this site. Nothing on this page is aspirational -
        it describes the code that runs today, and every score can be traced back to the inputs that produced it.
      </p>

      <h2 style={h2}>Inputs and weights</h2>
      <p style={p}>
        The health grade starts at 100 and subtracts five weighted penalty factors, computed over the trailing
        90 days of published events. The risk score is 100 minus the health grade.
      </p>
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th} scope="col">Factor</th>
              <th style={{ ...th, width: 70 }} scope="col">Weight</th>
              <th style={th} scope="col">How it is computed</th>
            </tr>
          </thead>
          <tbody>
            {FACTORS.map(f => (
              <tr key={f.name}>
                <td style={{ ...td, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{f.name}</td>
                <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{f.weight}</td>
                <td style={td}>{f.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ ...p, marginTop: 12 }}>
        Deliberately <strong style={{ color: 'var(--text)' }}>not</strong> inputs: commission level or commission
        changes (shown on the surface, but not scored), stake size, and token price. A slashing event contributes
        to the incident count like any other published event - slashing history is not separately weighted.
      </p>

      <h2 style={h2}>Tiers</h2>
      <div style={{ ...card, maxWidth: 420 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th} scope="col">Tier</th>
              <th style={th} scope="col">Score band</th>
            </tr>
          </thead>
          <tbody>
            {TIER_ROWS.map(t => (
              <tr key={t.label}>
                <td style={{ ...td, fontWeight: 600, color: 'var(--text)' }}>{t.label}</td>
                <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{t.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ ...p, marginTop: 12 }}>
        <strong style={{ color: 'var(--text)' }}>These thresholds are operator-set judgement bands, not a
        derivation.</strong> They divide the 0–100 score into four ranks at round numbers we chose; they are not
        fitted to realized outcomes such as actual slashing or failure rates, because that calibration has not yet
        been done. A tier is therefore a <em>ranking band</em> - where a validator sits relative to others on the
        score - and not a prediction that a Critical validator will fail or that a Low one will not. We state this
        plainly rather than imply a derivation that does not exist. Calibrating the bands against outcome data is
        open work; when it is done, this section will say what they were fitted to.
      </p>

      <h2 style={h2}>What the stake figures mean</h2>
      <p style={p}>
        Where the surface shows a dollar figure next to a validator, it is that validator&rsquo;s total delegated
        stake (native stake times a live token price) - stake <em>associated with</em> a validator currently
        meeting risk conditions. It is never a prediction of loss, an expected-loss estimate, or a claim that the
        protocol will confiscate anything.
      </p>
      <p style={p}>
        Whether stake <em>can</em> be lost to a protocol penalty differs per network, and that difference is shown
        wherever risk is presented:
      </p>
      <div style={{ ...card, maxWidth: 640 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th} scope="col">Network</th>
              <th style={th} scope="col">Loss semantics</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(n => (
              <tr key={n.slug}>
                <td style={{ ...td, fontWeight: 600, color: 'var(--text)' }}>{n.name}</td>
                <td style={td}>
                  {n.slashes_principal == null
                    ? '-'
                    : n.slashes_principal
                      ? 'Slashing enforced - a protocol violation can destroy part of delegated principal.'
                      : 'No principal slashing - protocol penalties affect rewards or eligibility only; delegated principal is not slashed.'}
                </td>
              </tr>
            ))}
            {networks.length === 0 && (
              <tr>
                <td style={td} colSpan={2}>Loading network list…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ ...p, marginTop: 12 }}>
        For example: Solana does not enforce slashing today - SIMD-0204 deploys the Slashing Program for
        observability, giving the protocol a cryptographically-proven view of violations without modifying stakes
        or rewards. Sui&rsquo;s tallying rule withholds an epoch&rsquo;s staking rewards. On Ethereum, Cosmos Hub,
        Celestia and Polkadot, protocol violations destroy part of the bonded stake itself. Incidents on this site
        are operational observations; they do not imply misbehaviour or malice unless the event itself is a
        protocol-confirmed violation.
      </p>

      <h2 style={h2}>What the infrastructure scan reads</h2>
      <p style={p}>
        The 15% infrastructure factor uses two numbers from NullRabbit’s security scanner: the count of known CVEs
        associated with the software your node exposes, and the number of open, publicly-reachable services (ports)
        on the host your validator advertises. It reads only what is already public-facing - the scan is
        non-invasive: it does not attempt to exploit anything, access data, brute-force credentials, run
        denial-of-service tests, or touch private networks.
      </p>
      <p style={p}>
        You can verify this against your own host. NullRabbit publishes every IP it scans from and offers an
        opt-out, on its{' '}
        <a href="https://nullrabbit.ai/scanning" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>scanner transparency page</a>.
        A validator with no scannable public IP - most chains identify validators by an on-chain key, not a host -
        simply has no scan data, and the infrastructure factor contributes nothing (neither penalty nor credit) to
        its score.
      </p>

      <h2 style={h2}>Tracing a score</h2>
      <p style={p}>
        Click any validator row to see the signals behind its score: incident count, downtime, recovery,
        infrastructure findings, and the event history itself. The same inputs are available programmatically from{' '}
        <code style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12.5, background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 5 }}>
          GET /v1/risk/validators
        </code>
        , so any score can be recomputed independently.
      </p>

      <h2 style={h2}>Mechanism references</h2>
      <p style={p}>
        Slashr is NullRabbit’s live observation layer: it shows validator faults happening in the real world. Where
        an incident class corresponds to a documented fault mechanism, we point to the research registry that names
        it. Where no mechanism applies - the majority of incidents, which are operational or configuration events -
        we say so plainly.
      </p>
      <div style={{ ...card, maxWidth: 760 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th} scope="col">Incident class</th>
              <th style={th} scope="col">Mechanism</th>
            </tr>
          </thead>
          <tbody>
            {MECHANISM_REFS.map(m => (
              <tr key={m.group}>
                <td style={{ ...td, whiteSpace: 'normal' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{m.group}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{m.classes}</div>
                </td>
                <td style={td}>{m.mechanism}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={h2}>What the score does not claim</h2>
      <p style={p}>
        The index describes observed operational behaviour. It is not a prediction of future incidents, not a
        probability of slashing, not an expected-loss model, not a security audit, and not delegation advice. A
        low score is not an endorsement. Networks and detectors in their soak window are excluded from the public
        surface until they meet go-public criteria, so coverage differs by chain - a quiet chain may be quiet
        because it is quiet, or because a detector class is not yet public.
      </p>

      <h2 style={h2}>Known limitations</h2>
      <ul style={{ ...p, paddingLeft: 20, display: 'grid', gap: 6 }}>
        <li>One global formula: weights and thresholds are currently identical across networks with very different penalty regimes.</li>
        <li>Tier thresholds are operator-set judgement bands, not yet calibrated against realized outcomes.</li>
        <li>The window is 90 days: older history does not affect the score.</li>
        <li>Only published events count - gated chains and gated detector classes are excluded until their soak completes.</li>
        <li>Infrastructure scan coverage is partial; validators without a scan are not penalised on that factor.</li>
        <li>Uptime percentage is not yet an input.</li>
      </ul>

      <h2 style={h2}>Disputes</h2>
      <p style={p}>
        Operators will sometimes disagree with a score. There is no formal dispute process today - we would rather
        say that plainly than imply one exists. What we do offer: every score is mechanically reproducible from
        the published events shown on the validator&rsquo;s profile, so a dispute is always a dispute about a
        specific event. If an underlying event is factually wrong (for example a detector fault), reach us on X
        at{' '}
        <a href="https://x.com/SlashrDev" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>@SlashrDev</a>{' '}
        and we will review the event data. Factually wrong events can be suppressed by an operator, which removes
        them from scoring; scores themselves are never manually adjusted.
      </p>

      <h2 id="corrections" style={{ ...h2, scrollMarginTop: 80 }}>Corrections</h2>
      <p style={p}>
        When we change how the score is calculated in a way that moves published scores, we record it here with a
        date and a reason rather than letting scores shift silently.
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        {CORRECTIONS.map(c => (
          <div key={c.date} style={{ ...card, padding: '14px 16px', maxWidth: 760 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.title}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{c.date}</span>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-2)' }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
