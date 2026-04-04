import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useShareCard } from '@/hooks/useShareCard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePageMeta } from '@/hooks/usePageMeta';
import { NETWORK_META } from '@/lib/constants';
import { detectNetwork, detectValidatorAddress, looksLikePrivateKey, validateWalletAddress } from '@/lib/addressValidation';
import { useRotatingPlaceholder } from '@/hooks/useRotatingPlaceholder';
import { formatUsdLarge } from '@/lib/format';
import { PortfolioSummaryCard } from '@/components/health/PortfolioSummaryCard';
import { ValidatorBreakdownCard } from '@/components/health/ValidatorBreakdownCard';
import { LoadingSequence } from '@/components/health/LoadingSequence';
import { MethodologyNote } from '@/components/health/MethodologyNote';
import { HealthCardPng } from '@/components/health/HealthCardPng';
import { CheckCleanCTA } from '@/components/CheckCleanCTA';

const EXAMPLE_ADDRESSES = [
  'e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  'e.g. cosmos1clpqr4nrk4khgkxj78fcwwh6dl3ual4tzqj2l',
  'e.g. 0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
  'e.g. 0x4e7f1...',
];

export default function CheckPage() {
  const isMobile = useIsMobile();
  const placeholder = useRotatingPlaceholder(EXAMPLE_ADDRESSES, 3500);
  const { data, loading, error, check, reset } = useHealthCheck();
  const [searchParams, setSearchParams] = useSearchParams();
  const [walletInput, setWalletInput] = useState(() => searchParams.get('address') ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const didAutoSearch = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { share, copyLink, generating, toastMessage } = useShareCard(cardRef, data);

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

  const isPrivateKey = useMemo(
    () => looksLikePrivateKey(walletInput.trim()),
    [walletInput],
  );

  const detectedNetwork = useMemo(() => {
    if (walletInput.length < 8) return null;
    return detectNetwork(walletInput);
  }, [walletInput]);

  const detectedValidator = useMemo(() => {
    if (walletInput.trim().length < 8) return null;
    if (detectedNetwork) return null;
    return detectValidatorAddress(walletInput.trim());
  }, [walletInput, detectedNetwork]);

  // Auto-search on load if address is in query params
  useEffect(() => {
    if (didAutoSearch.current) return;
    const addr = searchParams.get('address');
    if (!addr || addr.trim().length < 8) return;
    const result = validateWalletAddress(addr.trim());
    if (!result.valid) return;
    didAutoSearch.current = true;
    check(addr.trim());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (value: string) => {
    setWalletInput(value);
    setValidationError(null);
  };

  const handleSubmit = () => {
    const trimmed = walletInput.trim();
    if (!trimmed) return;
    if (isPrivateKey) return;
    if (detectedValidator) return;

    const result = validateWalletAddress(trimmed);
    if (!result.valid) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    setSearchParams({ address: trimmed });
    reset();
    check(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const allClean = data
    && data.validators.length > 0
    && data.validators.every(v => v.grade === 'A');

  return (
    <div style={{ paddingTop: 8, maxWidth: 640 }}>
      {/* Title */}
      <h2
        style={{
          fontSize: isMobile ? 20 : 24,
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
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={walletInput}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--color-bg-surface, var(--color-bg-card))',
            border: `1px solid ${isPrivateKey || validationError ? 'var(--color-danger)' : 'var(--color-separator)'}`,
            borderRadius: 4,
            color: 'var(--color-text-primary)',
            fontSize: 15,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease',
          }}
        />
        {walletInput === '' && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              color: 'var(--color-text-ghost)',
              fontSize: 15,
              fontFamily: "'JetBrains Mono', monospace",
              pointerEvents: 'none',
              opacity: placeholder.opacity,
              transition: 'opacity 0.3s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {placeholder.text}
          </span>
        )}
      </div>
      {isPrivateKey ? (
        <div
          style={{
            margin: '8px 0 0',
            padding: '10px 14px',
            background: 'rgba(255, 69, 69, 0.08)',
            border: '1px solid rgba(255, 69, 69, 0.2)',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-danger)',
          }}
        >
          ⚠ That looks like a private key. Never paste private keys anywhere. This field expects a wallet address.
        </div>
      ) : validationError ? (
        <p
          style={{
            fontSize: 12,
            color: '#FF4545',
            fontFamily: "'JetBrains Mono', monospace",
            margin: '6px 0 0',
          }}
        >
          {validationError}
        </p>
      ) : (
        <p
          style={{
            fontSize: 11,
            color: 'var(--color-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            margin: '6px 0 0',
          }}
        >
          Please don't accidentally paste your private key in here folks 🫠
        </p>
      )}

      {/* Validator address redirect */}
      {detectedValidator && (
        <div
          style={{
            fontSize: 13,
            color: '#e8a735',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '12px 0 0',
          }}
        >
          This looks like a validator address, not a wallet.{' '}
          <Link
            to={`/validator/${detectedValidator.network}/${encodeURIComponent(walletInput.trim())}`}
            style={{
              color: '#e8a735',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            View on {NETWORK_META[detectedValidator.network]?.name ?? detectedValidator.network} →
          </Link>
        </div>
      )}

      {/* Submit */}
      {!loading && !data && (
        <button
          onClick={handleSubmit}
          disabled={!walletInput.trim() || isPrivateKey}
          style={{
            marginTop: 12,
            padding: '10px 24px',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: !walletInput.trim() || isPrivateKey ? 'not-allowed' : 'pointer',
            background: isPrivateKey ? 'var(--color-bg-card)' : 'var(--color-text-primary)',
            color: isPrivateKey ? 'var(--color-text-dim)' : 'var(--color-bg)',
            border: 'none',
            opacity: !walletInput.trim() || isPrivateKey ? 0.4 : 1,
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
            color: '#FF4545',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '12px 0',
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

          {/* Portfolio + validator cards */}
          {data.validators.length > 0 && (
            <>
              <PortfolioSummaryCard
                portfolio={data.portfolio}
                network={data.network}
                onShare={share}
                onCopyLink={copyLink}
                generating={generating}
              />

              {allClean && (
                <div style={{ marginTop: 16 }}>
                  <CheckCleanCTA walletAddress={data.address} network={data.network} />
                </div>
              )}

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
                setSearchParams({});
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

      {/* Off-screen card for PNG capture */}
      {data && data.validators.length > 0 && (
        <div
          ref={cardRef}
          style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}
        >
          <HealthCardPng data={data} />
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-accent)',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            zIndex: 1000,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
