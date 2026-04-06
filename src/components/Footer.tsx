import { Link } from 'react-router-dom';
import { BoltLogo } from './BoltLogo';
import { TelegramIcon } from './TelegramIcon';
import { XIcon } from './XIcon';
import { useIsMobile } from '@/hooks/useIsMobile';

interface FooterProps {
  onOpenWaitlist: () => void;
}

const linkStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
  color: 'var(--color-text-dim)',
  textDecoration: 'none',
  transition: 'color 0.15s ease',
};

const iconLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-dim)',
  padding: 2,
  transition: 'color 0.15s ease',
};

function hoverIn(e: React.MouseEvent) {
  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
}
function hoverOut(e: React.MouseEvent) {
  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-dim)';
}

export function Footer({ onOpenWaitlist }: FooterProps) {
  const isMobile = useIsMobile();

  return (
    <div style={{ borderTop: '1px solid var(--color-border)' }}>
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: isMobile ? '14px 16px' : '16px 20px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 12 : 0,
        }}
      >
        {/* Left: brand + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BoltLogo size={14} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.04em',
              color: 'var(--color-text-dim)',
            }}
          >
            slashr
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--color-text-ghost)',
            }}
          >
            Live validator incident feed.
          </span>
        </div>

        {/* Right: links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16, flexWrap: 'wrap' }}>
          <Link
            to="/alerts"
            style={linkStyle}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            Alerts
          </Link>
          <button
            onClick={onOpenWaitlist}
            style={{
              ...linkStyle,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            Stay in the loop
          </button>
          <Link
            to="/developers"
            style={linkStyle}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            Developers
          </Link>
          <a
            href="https://nullrabbit.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...iconLinkStyle, gap: 4 }}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            <img
              src="/nullrabbit.png"
              alt="NullRabbit"
              style={{ height: 16, width: 16, objectFit: 'contain' }}
            />
          </a>
          <a
            href="https://x.com/SlashrDev"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            style={iconLinkStyle}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            <XIcon size={14} />
          </a>
          <a
            href="https://t.me/SlashrDevBot"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            style={iconLinkStyle}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            <TelegramIcon size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
