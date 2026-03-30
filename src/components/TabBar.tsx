import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';

const TABS = [
  { label: 'live feed', path: '/' },
  { label: 'validators', path: '/validators' },
  { label: 'leaderboard', path: '/leaderboard' },
  { label: 'reports', path: '/reports' },
  { label: 'check wallet', path: '/check' },
] as const;

export function TabBar() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTab = TABS.find(t => t.path === pathname) ?? TABS[0];

  // Close on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Desktop: horizontal tab bar (unchanged)
  if (!isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 12,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {TABS.map(tab => {
          const active = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                fontSize: 12,
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-dim)',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '8px 16px 10px',
                borderBottom: active ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                marginBottom: -1,
                textDecoration: 'none',
                transition: 'color 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    );
  }

  // Mobile: dropdown trigger + menu
  return (
    <div ref={containerRef} style={{ position: 'relative', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid var(--color-border)',
          padding: '8px 2px 10px',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        <span>{currentTab.label}</span>
        <span
          style={{
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            fontSize: 10,
            color: 'var(--color-text-dim)',
          }}
        >
          {'\u25BE'}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: -16,
            right: -16,
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-medium)',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            zIndex: 150,
            overflow: 'hidden',
          }}
        >
          {TABS.map((tab, i) => {
            const active = pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="nav-dropdown-item"
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 14px',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-dim)',
                  background: active ? 'var(--color-bg-surface)' : 'transparent',
                  borderLeft: active ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                  borderBottom: i < TABS.length - 1 ? '1px solid var(--color-border)' : 'none',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease, background 0.15s ease',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
