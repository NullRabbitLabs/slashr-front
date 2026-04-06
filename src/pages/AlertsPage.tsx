import { useSearchParams } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import SubscribeForm from '@/components/alerts/SubscribeForm';

export default function AlertsPage() {
  const [searchParams] = useSearchParams();
  const prefillAddress = searchParams.get('address') ?? '';

  usePageMeta({
    title: 'Get alerts — slashr',
    description: 'Subscribe to email alerts for validator incidents across Solana, Ethereum, Cosmos, and Sui.',
  });

  return (
    <div style={{ padding: '32px 0' }}>
      <h2
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-dim)',
          margin: '0 0 8px',
        }}
      >
        Email alerts
      </h2>
      <p
        style={{
          fontSize: 14,
          fontFamily: "'Inter', sans-serif",
          color: 'var(--color-text-secondary)',
          margin: '0 0 24px',
          lineHeight: 1.5,
        }}
      >
        Get notified when a validator you care about has an incident. No account needed — just an email and an address.
      </p>

      <SubscribeForm initialAddress={prefillAddress} />
    </div>
  );
}
