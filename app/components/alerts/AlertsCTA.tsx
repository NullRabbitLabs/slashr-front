import { Link } from 'react-router';

interface Props {
  address: string;
  text?: string;
}

export default function AlertsCTA({ address, text }: Props) {
  const href = `/alerts?address=${encodeURIComponent(address)}`;

  return (
    <div
      style={{
        marginTop: 16,
        padding: '14px 16px',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          color: 'var(--color-text-secondary)',
        }}
      >
        {text ?? 'Want to know when your validators go down?'}
      </span>
      <Link
        to={href}
        style={{
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          padding: '6px 14px',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}
      >
        Get email alerts
      </Link>
    </div>
  );
}
