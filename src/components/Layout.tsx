import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { StatsResponse } from '@/types/api';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNetworks } from '@/hooks/useNetworks';
import { RiskDrawerProvider } from './risk/RiskDrawer';
import { WaitlistDrawer } from './WaitlistDrawer';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  stats: StatsResponse | null;
}

const NAV: Array<{ label: string; path: string }> = [
  { label: 'Overview', path: '/' },
  { label: 'Risk', path: '/risk' },
  { label: 'Live Feed', path: '/feed' },
  { label: 'Validators', path: '/validators' },
  { label: 'Reports', path: '/reports' },
];

// Secondary destinations, surfaced in the mobile menu (off the desktop nav).
const SECONDARY: Array<{ label: string; path: string }> = [
  { label: 'Insights', path: '/insights' },
  { label: 'Rankings', path: '/rankings' },
  { label: 'Check a wallet', path: '/check' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Developers / API', path: '/developers' },
];

export function Layout({ children, stats }: LayoutProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const { user } = useAuth();
  const { networks } = useNetworks();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const totalEvents = stats?.totals.all_time;
  const netCount = networks.length || 8;

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const go = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <RiskDrawerProvider>
      <div
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Geist Sans', system-ui, sans-serif",
          fontFeatureSettings: '"cv01" 1',
        }}
      >
        {/* Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'saturate(1.2)',
          }}
        >
          <div
            className="rd-header-inner"
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '0 28px',
              height: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
            }}
          >
            {/* brand */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(47,107,255,.35)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#fff" />
                </svg>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)' }}>slashr</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                  padding: '2px 6px',
                  borderRadius: 5,
                  letterSpacing: '.02em',
                }}
              >
                RISK
              </span>
            </a>

            {/* nav */}
            <nav className="rd-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {NAV.map(item => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      fontSize: 13.5,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      border: 'none',
                      padding: '7px 13px',
                      borderRadius: 9,
                      background: active ? 'var(--surface-2)' : 'transparent',
                      color: active ? 'var(--text)' : 'var(--text-3)',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* right */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)' }} className="rd-status">
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--ok)',
                    animation: 'slashr-pulse 2.4s ease-in-out infinite',
                  }}
                />
                <span>
                  <span style={{ color: 'var(--text)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {totalEvents != null ? totalEvents.toLocaleString() : '—'}
                  </span>{' '}
                  events · {netCount} networks
                </span>
              </div>
              <button
                onClick={toggleTheme}
                title="Toggle theme"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 14 }}>{theme === 'dark' ? '◑' : '◐'}</span>
              </button>
              <button
                onClick={() => navigate(user ? '/account' : '/login')}
                className="rd-cta-hide"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '8px 15px',
                  borderRadius: 9,
                  cursor: 'pointer',
                }}
              >
                {user ? 'Account' : 'Log in'}
              </button>
              <button
                onClick={() => navigate('/developers')}
                className="rd-cta-hide"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  background: 'var(--accent)',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(47,107,255,.3)',
                }}
              >
                Request API access
              </button>
              <button
                className="rd-hamburger"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Menu"
                aria-expanded={menuOpen}
                style={{
                  display: 'none',
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                  lineHeight: 1,
                }}
              >
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div
              style={{
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '8px 14px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {NAV.map(item => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    style={{
                      textAlign: 'left',
                      fontSize: 15,
                      fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                      border: 'none',
                      padding: '11px 12px',
                      borderRadius: 9,
                      background: active ? 'var(--surface-2)' : 'transparent',
                      color: active ? 'var(--text)' : 'var(--text-2)',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              {SECONDARY.map(item => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  style={{
                    textAlign: 'left',
                    fontSize: 13.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    padding: '10px 12px',
                    borderRadius: 9,
                    background: 'transparent',
                    color: 'var(--text-3)',
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => go(user ? '/account' : '/login')}
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  padding: '11px 12px',
                  borderRadius: 9,
                  cursor: 'pointer',
                }}
              >
                {user ? 'Account' : 'Log in'}
              </button>
              <button
                onClick={() => go('/developers')}
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  background: 'var(--accent)',
                  border: 'none',
                  padding: '11px 12px',
                  borderRadius: 9,
                  cursor: 'pointer',
                }}
              >
                Request API access
              </button>
            </div>
          )}
        </header>

        {/* Main */}
        <main className="rd-main" style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '32px 28px 80px' }}>
          {children}
        </main>

        <Footer onOpenWaitlist={() => setWaitlistOpen(true)} />
        <WaitlistDrawer open={waitlistOpen} onOpenChange={setWaitlistOpen} />
      </div>
    </RiskDrawerProvider>
  );
}
