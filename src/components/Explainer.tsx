export function Explainer() {
  return (
    <details style={{ marginBottom: 24 }}>
      <summary
        style={{
          fontSize: 13,
          color: 'var(--color-text-cta)',
          cursor: 'pointer',
          padding: '8px 0',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        &#8627; new to this? what am i looking at? ✌️
      </summary>
      <div
        style={{
          padding: 16,
          marginTop: 4,
          background: 'var(--color-bg-hover)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: '0 0 10px' }}>
          Blockchains are kept running by{' '}
          <strong style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>validators</strong> &mdash;
          machines that verify transactions. They put up money as a guarantee
          they'll behave.
        </p>
        <p style={{ margin: '0 0 10px' }}>
          When they don't &mdash; they go offline, sign contradictory data, or act
          against the network &mdash; they get{' '}
          <strong style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>penalised</strong>.
          Sometimes a slap on the wrist. Sometimes they lose everything.
        </p>
        <p style={{ margin: 0 }}>
          This is a live feed of every penalty event we detect. Across Ethereum,
          Solana, Cosmos, and Sui. As it happens.
        </p>
      </div>
    </details>
  );
}
