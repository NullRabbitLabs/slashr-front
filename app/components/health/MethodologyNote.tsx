export function MethodologyNote() {
  return (
    <details
      style={{
        marginTop: 24,
        fontSize: 12,
        fontFamily: "'Inter', sans-serif",
        color: 'var(--color-text-dim)',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--color-text-dim)',
          padding: '8px 0',
        }}
      >
        How we calculate this
      </summary>
      <div
        style={{
          padding: '8px 0',
          lineHeight: 1.6,
          color: 'var(--color-text-tertiary)',
        }}
      >
        <p style={{ margin: '0 0 8px' }}>
          <strong>Grades</strong> are based on incident frequency, total downtime, recovery speed,
          infrastructure scan results (CVEs, exposed services), and repeat failure patterns over 90 days.
          Scores range from 0&ndash;100: A &ge; 90, B &ge; 75, C &ge; 55, D &ge; 35, F &lt; 35.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Cost of downtime</strong> estimates your missed staking rewards during validator outages,
          based on your stake amount, the chain&rsquo;s reward rate, and current token prices.
          All estimates are approximate &mdash; actual reward losses may vary.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Alternatives</strong> are validators on the same chain with better grades, similar or lower
          commission, and active participation. We exclude the top 5 validators by stake to
          promote decentralisation.
        </p>
      </div>
    </details>
  );
}
