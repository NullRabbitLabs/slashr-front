import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDelegations } from '@/hooks/useDelegations';
import { DelegationCard } from '@/components/DelegationCard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { NETWORK_META, NETWORK_ORDER } from '@/lib/constants';
import type { NetworkSlug } from '@/types/api';

const DELEGATION_NETWORKS: NetworkSlug[] = NETWORK_ORDER.filter(
  n => n !== 'polkadot'
) as NetworkSlug[];

function detectNetwork(address: string): NetworkSlug | null {
  if (address.startsWith('cosmos1') || address.startsWith('atom1')) return 'cosmos';
  if (address.startsWith('0x') || address.startsWith('0X')) {
    const hex = address.slice(2);
    if (hex.length === 40 && /^[0-9a-fA-F]+$/.test(hex)) return 'ethereum';
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) return 'sui';
  }
  if (address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
    return 'solana';
  }
  return null;
}

function detectValidatorAddress(address: string): { network: NetworkSlug } | null {
  if (address.startsWith('cosmosvaloper1')) return { network: 'cosmos' };
  if (address.startsWith('0x') || address.startsWith('0X')) {
    const hex = address.slice(2);
    if (hex.length === 96 && /^[0-9a-fA-F]+$/.test(hex)) return { network: 'ethereum' };
  }
  return null;
}

export default function CheckPage() {
  const isMobile = useIsMobile();
  const { data, loading, error, lookup } = useDelegations();
  const [walletInput, setWalletInput] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkSlug | 'auto'>('auto');

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

  const showFormatHint = selectedNetwork === 'auto'
    && walletInput.trim().length >= 8
    && detectedNetwork === null
    && detectedValidator === null;

  const handleSubmit = () => {
    const network = effectiveNetwork || 'auto';
    if (walletInput.trim().length < 8) return;
    lookup(network, walletInput.trim());
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
      <input
        type="text"
        value={walletInput}
        onChange={e => setWalletInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste your wallet address"
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'var(--color-bg-surface, var(--color-bg-card))',
          border: '1px solid var(--color-separator)',
          borderRadius: 4,
          color: 'var(--color-text-primary)',
          fontSize: 15,
          fontFamily: "'JetBrains Mono', monospace",
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
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
        disabled={loading || walletInput.trim().length < 8}
        style={{
          padding: '10px 24px',
          borderRadius: 4,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: loading || walletInput.trim().length < 8 ? 'not-allowed' : 'pointer',
          background: loading ? 'var(--color-bg-card)' : 'var(--color-text-primary)',
          color: loading ? 'var(--color-text-dim)' : 'var(--color-bg)',
          border: 'none',
          opacity: walletInput.trim().length < 8 ? 0.4 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        {loading ? 'checking...' : 'check'}
      </button>

      {/* Validator address redirect */}
      {detectedValidator && !error && (
        <div
          style={{
            fontSize: 13,
            color: '#e8a735',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '12px 0 0',
          }}
        >
          This looks like a validator address. Looking for this?{' '}
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

      {/* Address format hint */}
      {showFormatHint && !error && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '8px 0 0',
          }}
        >
          Unrecognized address format — try selecting a network above.
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
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
                No incidents found
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
        </div>
      )}
    </div>
  );
}
