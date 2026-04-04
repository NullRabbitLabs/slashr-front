import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePageMeta } from '@/hooks/usePageMeta';
import { detectNetwork, detectValidatorAddress, isLikelyPrivateKey } from '@/lib/address';
import { formatUsdLarge } from '@/lib/format';
import { NETWORK_META } from '@/lib/constants';
import { PortfolioSummaryCard } from '@/components/health/PortfolioSummaryCard';
import { ValidatorBreakdownCard } from '@/components/health/ValidatorBreakdownCard';
import { LoadingSequence } from '@/components/health/LoadingSequence';
import { MethodologyNote } from '@/components/health/MethodologyNote';
const PLACEHOLDER_EXAMPLES = [
  'e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  'e.g. cosmos1clpqr4nrk4khgkxj78fcwwh6dl3uas4ep7lkhq',
  'e.g. 0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
  'e.g. 0x' + 'a'.repeat(64),
];

export default function CheckPage() {
  const isMobile = useIsMobile();
  const { data, loading, error, check, reset } = useHealthCheck();
  const [walletInput, setWalletInput] = useState('');
  const [searchParams] = useSearchParams();
  const autoSubmitted = useRef(false);

  // Rotating placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit from URL ?address=
  useEffect(() => {
    if (autoSubmitted.current) return;
    const addr = searchParams.get('address');
    if (addr && addr.length >= 8) {
      autoSubmitted.current = true;
      setWalletInput(addr);
      check(addr);
    }
  }, [searchParams, check]);

  // Update URL when results arrive
  useEffect(() => {
    if (data && walletInput) {
      const url = new URL(window.location.href);
      url.searchParams.set('address', walletInput);
      window.history.replaceState(null, '', url.toString());
    }
  }, [data, walletInput]);

  // Dynamic page meta
  usePageMeta(
    data
      ? {
          title: `Grade ${data.portfolio.grade} \u00b7 ${data.network} \u00b7 slashr`,
          description: `${data.portfolio.validator_count} validators \u00b7 ${formatUsdLarge(data.portfolio.total_cost_of_downtime_usd)} lost to downtime (${data.portfolio.cost_period_days}d)`,
        }
      : {
          title: 'Check Your Validators \u00b7 slashr',
          description: 'Paste your wallet address. See your validators\' grades, incident history, and how much their downtime costs you.',
        },
  );

  const detectedNetwork = useMemo(() => {
    if (walletInput.length < 8) return null;
    return detectNetwork(walletInput.trim());
  }, [walletInput]);

  const detectedValidator = useMemo(() => {
    if (walletInput.trim().length < 8) return null;
    if (detectedNetwork) return null;
    return detectValidatorAddress(walletInput.trim());
  }, [walletInput, detectedNetwork]);

  const privateKeyWarning = useMemo(() => {
    return isLikelyPrivateKey(walletInput.trim());
  }, [walletInput]);

  const canSubmit = walletInput.trim().length >= 8
    && !loading
    && !privateKeyWarning
    && (detectedNetwork != null || !detectValidatorAddress(walletInput.trim()));

  const handleSubmit = () => {
    if (!canSubmit) return;
    reset();
    check(walletInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const allClean = data
    && data.validators.length > 0
    && data.validators.every(v => v.grade === 'A');

  return (
    <div style={{ paddingTop: 8, maxWidth: 640 }}>
      {/* Hero */}
      <h2
        style={{
          fontSize: isMobile ? 22 : 28,
          fontWeight: 700,
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '-0.04em',
          margin: '0 0 8px',
          color: 'var(--color-text-primary)',
        }}
      >
        What are your validators costing you?
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-tertiary)',
          fontFamily: "'Inter', sans-serif",
          margin: '0 0 20px',
          lineHeight: 1.5,
        }}
      >
        Paste your wallet address. We'll check your validators' incident history,
        scan their infrastructure, and estimate what their downtime costs you.
      </p>

      {/* Input */}
      <input
        type="text"
        value={walletInput}
        onChange={e => setWalletInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
        style={{
          width: '100%',
          padding: '14px 18px',
          background: 'var(--color-bg-surface, var(--color-bg-card))',
          border: `1px solid ${privateKeyWarning ? 'var(--color-danger)' : 'var(--color-separator)'}`,
          borderRadius: 4,
          color: 'var(--color-text-primary)',
          fontSize: 15,
          fontFamily: "'JetBrains Mono', monospace",
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Private key warning */}
      {privateKeyWarning && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-danger)',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            margin: '8px 0 0',
            padding: '8px 12px',
            background: 'rgba(255, 69, 69, 0.08)',
            border: '1px solid rgba(255, 69, 69, 0.2)',
            borderRadius: 4,
          }}
        >
          This looks like a private key. Do not paste private keys here. Use your wallet (public) address.
        </div>
      )}

      {/* Format hints */}
      {!privateKeyWarning && walletInput.trim().length >= 8 && !detectedNetwork && !detectedValidator && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            margin: '6px 0 0',
          }}
        >
          That doesn't look like a valid wallet address.
        </div>
      )}

      {/* Validator address redirect */}
      {detectedValidator && !error && (
        <div
          style={{
            fontSize: 13,
            color: '#e8a735',
            fontFamily: "'JetBrains Mono', monospace",
            margin: '8px 0 0',
          }}
        >
          This looks like a validator address.{' '}
          <Link
            to={`/validator/${detectedValidator.network}/${encodeURIComponent(walletInput.trim())}`}
            style={{ color: '#e8a735', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            View on {NETWORK_META[detectedValidator.network]?.name ?? detectedValidator.network} &rarr;
          </Link>
        </div>
      )}

      {/* Submit button */}
      {!loading && !data && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 12,
            padding: '10px 24px',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            background: canSubmit ? 'var(--color-text-primary)' : 'var(--color-bg-card)',
            color: canSubmit ? 'var(--color-bg)' : 'var(--color-text-dim)',
            border: 'none',
            opacity: canSubmit ? 1 : 0.4,
            transition: 'all 0.15s ease',
          }}
        >
          Check health
        </button>
      )}

      {/* Loading */}
      {loading && <LoadingSequence />}

      {/* Error */}
      {error && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '16px 0',
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ marginTop: 24 }}>
          {/* No delegations */}
          {data.message && data.validators.length === 0 && (
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-tertiary)',
                fontFamily: "'Inter', sans-serif",
                padding: '20px 0',
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: '0 0 8px' }}>{data.message}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-dim)' }}>
                Make sure you're pasting a delegator wallet address, not a validator address.
                We currently support Solana, Ethereum, Cosmos, and Sui.
              </p>
            </div>
          )}

          {/* Portfolio card */}
          {data.validators.length > 0 && (
            <>
              <PortfolioSummaryCard
                portfolio={data.portfolio}
                network={data.network}
              />

              {/* All clean celebration */}
              {allClean && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '16px 20px',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--color-accent)',
                      fontWeight: 500,
                      margin: '0 0 4px',
                    }}
                  >
                    All your validators have clean records.
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      fontFamily: "'Inter', sans-serif",
                      color: 'var(--color-text-dim)',
                      margin: 0,
                    }}
                  >
                    Want to know if that changes? Alerts coming soon.
                  </p>
                </div>
              )}

              {/* Validator cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {data.validators.map(v => (
                  <ValidatorBreakdownCard
                    key={v.address}
                    validator={v}
                    network={data.network}
                  />
                ))}
              </div>

              <MethodologyNote />
            </>
          )}

          {/* Check another */}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => {
                reset();
                setWalletInput('');
                window.history.replaceState(null, '', '/check');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 3,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Check another address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
