import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDelegations } from '@/hooks/useDelegations';
import { DelegationCard } from '@/components/DelegationCard';
import { CheckCleanCTA } from '@/components/CheckCleanCTA';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePageMeta } from '@/hooks/usePageMeta';
import { NETWORK_META, NETWORK_ORDER } from '@/lib/constants';
import { detectNetwork, detectValidatorAddress, looksLikePrivateKey, validateWalletAddress } from '@/lib/addressValidation';
import { useRotatingPlaceholder } from '@/hooks/useRotatingPlaceholder';
import type { NetworkSlug } from '@/types/api';

const DELEGATION_NETWORKS: NetworkSlug[] = NETWORK_ORDER.filter(
  n => n !== 'polkadot'
) as NetworkSlug[];

const EXAMPLE_ADDRESSES = [
  'e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  'e.g. cosmos1clpqr4nrk4khgkxj78fcwwh6dl3ual4tzqj2l',
  'e.g. 0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326',
  'e.g. 0x4e7f1...',
];

export default function CheckPage() {
  usePageMeta({
    title: 'Check Your Validators \u00b7 slashr',
    description: 'Paste your wallet address. See your validators\' incident history.',
  });
  const isMobile = useIsMobile();
  const placeholder = useRotatingPlaceholder(EXAMPLE_ADDRESSES, 3500);
  const { data, loading, error, lookup } = useDelegations();
  const [searchParams, setSearchParams] = useSearchParams();
  const [walletInput, setWalletInput] = useState(() => searchParams.get('address') ?? '');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkSlug | 'auto'>(() => {
    const n = searchParams.get('network');
    if (n && DELEGATION_NETWORKS.includes(n as NetworkSlug)) return n as NetworkSlug;
    return 'auto';
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const didAutoSearch = useRef(false);

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

  const effectiveNetwork = selectedNetwork === 'auto'
    ? detectedNetwork
    : selectedNetwork;

  // Auto-search on load if address is in query params
  useEffect(() => {
    if (didAutoSearch.current) return;
    const addr = searchParams.get('address');
    if (!addr || addr.trim().length < 8) return;
    const result = validateWalletAddress(addr.trim());
    if (!result.valid) return;
    didAutoSearch.current = true;
    const net = effectiveNetwork || 'auto';
    lookup(net, addr.trim());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (value: string) => {
    setWalletInput(value);
    setValidationError(null);
  };

  const handleSubmit = () => {
    const trimmed = walletInput.trim();
    if (!trimmed) return;
    if (isPrivateKey) return;
    if (detectedValidator) return; // validator address — redirect shown, don't validate as wallet

    const result = validateWalletAddress(trimmed);
    if (!result.valid) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    const network = effectiveNetwork || 'auto';

    const params: Record<string, string> = { address: trimmed };
    if (network !== 'auto') params['network'] = network;
    setSearchParams(params);

    lookup(network, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const allClean = data && data.delegations.length > 0 &&
    data.delegations.every(d => d.severity_score_30d === 0);

  return (
    <div style={{ paddingTop: 8 }}>
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
        Check your validators
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-tertiary)',
          fontFamily: "'Inter', sans-serif",
          margin: '0 0 20px',
        }}
      >
        Paste your wallet address to see if any validators you've delegated to have had incidents.
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
            color: 'var(--color-danger)',
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

      {/* Network selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          margin: '12px 0',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setSelectedNetwork('auto')}
          style={{
            padding: '4px 10px',
            borderRadius: 3,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            border: `1px solid ${selectedNetwork === 'auto' ? 'var(--color-text-secondary)' : 'var(--color-border)'}`,
            background: selectedNetwork === 'auto' ? 'var(--color-bg-surface)' : 'transparent',
            color: selectedNetwork === 'auto' ? 'var(--color-text-primary)' : 'var(--color-text-dim)',
            transition: 'all 0.15s ease',
          }}
        >
          auto{detectedNetwork && selectedNetwork === 'auto' ? ` (${detectedNetwork})` : ''}
        </button>
        {DELEGATION_NETWORKS.map(slug => {
          const meta = NETWORK_META[slug];
          const active = selectedNetwork === slug;
          const detected = detectedNetwork === slug && selectedNetwork === 'auto';
          return (
            <button
              key={slug}
              onClick={() => setSelectedNetwork(slug)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 3,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                background: active ? `${meta.color}15` : 'transparent',
                color: active || detected ? meta.color : 'var(--color-text-dim)',
                border: `1px solid ${active ? `${meta.color}30` : detected ? `${meta.color}20` : 'var(--color-border)'}`,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: active || detected ? meta.color : 'var(--color-text-ghost)' }} />
              {meta.ticker}
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !walletInput.trim() || isPrivateKey}
        style={{
          padding: '10px 24px',
          borderRadius: 4,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: loading || !walletInput.trim() || isPrivateKey ? 'not-allowed' : 'pointer',
          background: loading || isPrivateKey ? 'var(--color-bg-card)' : 'var(--color-text-primary)',
          color: loading || isPrivateKey ? 'var(--color-text-dim)' : 'var(--color-bg)',
          border: 'none',
          opacity: !walletInput.trim() || isPrivateKey ? 0.4 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        {loading ? 'checking...' : 'check'}
      </button>

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
          {/* Note (e.g. Ethereum coming soon) */}
          {data.note && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-tertiary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontStyle: 'italic',
                marginBottom: 12,
                padding: '8px 12px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
              }}
            >
              {data.note}
            </div>
          )}

          {/* All clean banner */}
          {allClean && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  color: '#14F195',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                All your validators are clean ✓
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-dim)',
                  fontFamily: "'Inter', sans-serif",
                  marginTop: 4,
                }}
              >
                Based on events we've collected. We may not have complete history for all validators.
              </div>
            </div>
          )}

          {/* Delegation cards */}
          {data.delegations.length > 0 ? (
            data.delegations.map(d => (
              <DelegationCard
                key={d.validator_address}
                delegation={d}
              />
            ))
          ) : (
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-tertiary)',
                fontFamily: "'Inter', sans-serif",
                padding: '20px 0',
              }}
            >
              No delegations found for this address.
            </div>
          )}

          {/* CTA */}
          {allClean ? (
            <div style={{ marginTop: 24 }}>
              <CheckCleanCTA walletAddress={data.wallet} network={data.network} />
            </div>
          ) : (
            <div
              style={{
                marginTop: 24,
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
                  color: 'var(--color-text-secondary)',
                  fontFamily: "'Inter', sans-serif",
                  margin: 0,
                }}
              >
                Get notified when your validators have issues
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-dim)',
                  fontFamily: "'JetBrains Mono', monospace",
                  margin: '6px 0 0',
                }}
              >
                coming soon
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
