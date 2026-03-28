import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { label: 'live feed', path: '/' },
  { label: 'validators', path: '/validators' },
  { label: 'reports', path: '/reports' },
] as const;

export function TabBar() {
  const { pathname } = useLocation();

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
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
