import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { detectNetwork, looksLikePrivateKey, validateWalletAddress } from '@/lib/addressValidation';
import { NETWORK_META } from '@/lib/constants';
import { NetworkTag } from '@/components/NetworkTag';
import { useSubscribe } from '@/hooks/useAlerts';
import { useIsMobile } from '@/hooks/useIsMobile';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  initialAddress?: string;
}

export default function SubscribeForm({ initialAddress = '' }: Props) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState(initialAddress);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const { submit, loading, success, error, reset } = useSubscribe();

  const detectedNetwork = useMemo(() => {
    const trimmed = address.trim();
    if (!trimmed) return null;
    return detectNetwork(trimmed);
  }, [address]);

  const isPrivateKey = useMemo(() => looksLikePrivateKey(address.trim()), [address]);

  const handleSubmit = () => {
    setEmailError(null);
    setAddressError(null);

    const trimmedEmail = email.trim();
    const trimmedAddress = address.trim();

    if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    const validation = validateWalletAddress(trimmedAddress);
    if (!validation.valid) {
      setAddressError(validation.error);
      return;
    }

    submit(trimmedEmail, trimmedAddress, detectedNetwork ?? undefined);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setAddressError(null);
    if (success) reset();
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(null);
    if (success) reset();
  };

  const canSubmit = email.trim().length > 0 && address.trim().length > 0 && !isPrivateKey && !loading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Email */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-dim)',
            marginBottom: 6,
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => handleEmailChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
          placeholder="you@example.com"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg)',
            border: `1px solid ${emailError ? 'var(--color-danger)' : 'var(--color-separator)'}`,
            borderRadius: 4,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {emailError && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)', fontFamily: "'Inter', sans-serif" }}>
            {emailError}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-dim)',
            marginBottom: 6,
          }}
        >
          Validator or wallet address
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={address}
            onChange={e => handleAddressChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
            placeholder="Paste a validator or wallet address"
            style={{
              width: '100%',
              padding: '10px 12px',
              paddingRight: detectedNetwork ? 80 : 12,
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg)',
              border: `1px solid ${isPrivateKey || addressError ? 'var(--color-danger)' : 'var(--color-separator)'}`,
              borderRadius: 4,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {detectedNetwork && !isPrivateKey && (
            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
              <NetworkTag network={detectedNetwork} />
            </div>
          )}
        </div>
        {isPrivateKey && (
          <div
            style={{
              marginTop: 8,
              padding: '10px 12px',
              background: 'rgba(255,69,69,0.08)',
              border: '1px solid rgba(255,69,69,0.2)',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              color: 'var(--color-danger)',
              lineHeight: 1.5,
            }}
          >
            That looks like a private key. Never paste private keys anywhere. This field expects a validator or wallet address.
          </div>
        )}
        {addressError && !isPrivateKey && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)', fontFamily: "'Inter', sans-serif" }}>
            {addressError}
          </p>
        )}
        {!isPrivateKey && !addressError && detectedNetwork && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-dim)', fontFamily: "'Inter', sans-serif" }}>
            Detected: {NETWORK_META[detectedNetwork]?.name ?? detectedNetwork}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          padding: '10px 20px',
          borderRadius: 4,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          background: canSubmit ? 'var(--color-text-primary)' : 'var(--color-bg-surface)',
          color: canSubmit ? 'var(--color-bg)' : 'var(--color-text-dim)',
          border: 'none',
          alignSelf: isMobile ? 'stretch' : 'flex-start',
        }}
      >
        {loading ? 'Subscribing...' : 'Get alerts'}
      </button>

      {/* Success */}
      {success && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(20, 241, 149, 0.06)',
            border: '1px solid rgba(20, 241, 149, 0.15)',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: "'Inter', sans-serif",
            color: 'var(--color-text-primary)',
            lineHeight: 1.5,
          }}
        >
          {success.status === 'already_verified' ? (
            "You're already receiving alerts for this address."
          ) : success.status === 'resent' ? (
            `We resent the verification email to ${email.trim()}.`
          ) : (
            <>Check your email to verify. We sent a confirmation link to <strong>{email.trim()}</strong>.</>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(255, 69, 69, 0.06)',
            border: '1px solid rgba(255, 69, 69, 0.15)',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: "'Inter', sans-serif",
            color: 'var(--color-danger)',
            lineHeight: 1.5,
          }}
        >
          {error}
          {error.toLowerCase().includes('maximum') && (
            <>
              {' '}
              <Link
                to="/alerts/manage"
                style={{ color: 'var(--color-danger)', textDecoration: 'underline' }}
              >
                Manage your alerts
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
