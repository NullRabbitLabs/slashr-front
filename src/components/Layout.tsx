import type { ReactNode } from 'react';
import type { StatsResponse } from '@/types/api';
import { LiveDot } from './LiveDot';
import { BoltLogo } from './BoltLogo';

interface LayoutProps {
  children: ReactNode;
  stats: StatsResponse | null;
}

export function Layout({ children, stats }: LayoutProps) {
  const totalEvents = stats?.totals.all_time;

  return (
    <div
      style={{
        background: '#0A0A0B',
        color: '#E8E6E1',
        minHeight: '100vh',
        fontFamily: "'Inter', 'Helvetica Neue', -apple-system, sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LiveDot />
          <span
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {totalEvents != null
              ? `tracking ${totalEvents.toLocaleString()} events across 4 networks`
              : 'watching validators'}
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          nullrabbit.ai
        </span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
        {/* Hero */}
        <div style={{ padding: '48px 0 40px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <BoltLogo size={42} />
          <div>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                margin: '0 0 12px',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #E8E6E1 0%, #E8E6E1 40%, #FF4545 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              slasher
            </h1>
            <p
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.45)',
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 480,
              }}
            >
              Every validator penalty, across every major proof-of-stake network, as it
              happens. No delays. No spin. Just the data.
            </p>
          </div>
        </div>

        {/* Page content */}
        {children}

        {/* Footer */}
        <div
          style={{
            marginTop: 40,
            padding: '20px 0 40px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>polling every 30–120s</span>
          <span>
            built by{' '}
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>nullrabbit</span>
          </span>
        </div>
      </div>
    </div>
  );
}
