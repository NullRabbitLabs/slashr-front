import type { ReactNode } from 'react';
import type { StatsResponse } from '@/types/api';
import { LiveDot } from './LiveDot';
import { BoltLogo } from './BoltLogo';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTheme } from '@/hooks/useTheme';
import { WaitlistDrawer } from './WaitlistDrawer';

interface LayoutProps {
  children: ReactNode;
  stats: StatsResponse | null;
}

export function Layout({ children, stats }: LayoutProps) {
  const isMobile = useIsMobile();
  const { theme, toggle: toggleTheme } = useTheme();
  const totalEvents = stats?.totals.all_time;

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        minHeight: '100vh',
        fontFamily: "'Inter', 'Helvetica Neue', -apple-system, sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: isMobile ? '12px 16px' : '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: brand */}
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <BoltLogo size={20} />
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                fontFamily: "'Space Grotesk', sans-serif",
                background:
                  'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-primary) 40%, var(--color-danger) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              slasher
            </h1>
          </a>

          {/* Right: live status + theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiveDot />
            {!isMobile && totalEvents != null && (
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-tertiary)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                tracking {totalEvents.toLocaleString()} events across 4 networks
              </span>
            )}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: 4,
                color: 'var(--color-text-primary)',
              }}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: isMobile ? '0 16px' : '0 20px',
        }}
      >
        {/* Spacer replacing the old hero */}
        <div style={{ height: isMobile ? 20 : 32 }} />

        {/* Page content */}
        {children}

        {/* Footer */}
        <div
          style={{
            marginTop: 40,
            padding: '20px 0 40px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <a
            href="https://nullrabbit.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--color-text-tertiary)',
              textDecoration: 'none',
            }}
          >
            Built by
            <img
              src="/nullrabbit.png"
              alt="NullRabbit"
              style={{ height: 16, width: 16, objectFit: 'contain' }}
            />
          </a>
        </div>
      </div>

      <WaitlistDrawer />
    </div>
  );
}
