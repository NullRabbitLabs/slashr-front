import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useReportProviders } from '@/hooks/useReportProviders';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const monoFont = "'JetBrains Mono', monospace";

export default function ReportsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Only send search to API if >= 2 chars
  const apiSearch = debouncedSearch.length >= 2 ? debouncedSearch : undefined;
  const apiLetter = activeLetter ?? undefined;

  const { providers, loading, loadingMore, error, hasMore, loadMore } = useReportProviders(apiSearch, apiLetter);

  // Clear letter when typing search and vice versa
  useEffect(() => {
    if (debouncedSearch.length >= 2) setActiveLetter(null);
  }, [debouncedSearch]);

  const handleLetterClick = (letter: string) => {
    setActiveLetter(prev => (prev === letter ? null : letter));
    setSearchInput('');
  };

  const handleClearAll = () => {
    setActiveLetter(null);
    setSearchInput('');
  };

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontFamily: monoFont,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-dim)',
          marginBottom: 16,
        }}
      >
        Provider Reliability Reports
      </div>

      {/* Search input */}
      <input
        type="text"
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        placeholder="search providers..."
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-separator)',
          borderRadius: 4,
          color: 'var(--color-text-primary)',
          fontSize: 13,
          fontFamily: monoFont,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 10,
        }}
      />

      {/* A-Z letter bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 16 }}>
        <button
          onClick={handleClearAll}
          style={{
            padding: '4px 8px',
            borderRadius: 3,
            background: !activeLetter ? 'var(--color-text-primary)' : 'var(--color-bg-hover)',
            color: !activeLetter ? 'var(--color-bg)' : 'var(--color-text-dim)',
            fontSize: 10,
            fontFamily: monoFont,
            fontWeight: 600,
            letterSpacing: '0.03em',
            border: `1px solid ${!activeLetter ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ALL
        </button>
        {LETTERS.map(letter => {
          const active = activeLetter === letter;
          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              style={{
                padding: '4px 6px',
                borderRadius: 3,
                background: active ? 'var(--color-text-primary)' : 'var(--color-bg-hover)',
                color: active ? 'var(--color-bg)' : 'var(--color-text-dim)',
                fontSize: 10,
                fontFamily: monoFont,
                fontWeight: 600,
                border: `1px solid ${active ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minWidth: 24,
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {loading && (
        <div style={{ padding: '20px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          Loading...
        </div>
      )}

      {error && (
        <div style={{ padding: '20px 0', color: 'var(--color-text-dim)', fontSize: 13 }}>
          having trouble reaching the api — retrying
        </div>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              fontSize: 11,
              fontFamily: monoFont,
              color: 'var(--color-text-ghost)',
              marginBottom: 8,
            }}
          >
            {providers.length} provider{providers.length !== 1 ? 's' : ''}
          </div>

          {providers.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              {apiSearch || apiLetter
                ? 'No providers match your filter.'
                : 'No reliability reports generated yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {providers.map(p => (
                <Link
                  key={p.provider_slug}
                  to={`/reports/${p.provider_slug}`}
                  className="event-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        marginBottom: 4,
                      }}
                    >
                      {p.provider_name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: monoFont,
                        color: 'var(--color-text-dim)',
                      }}
                    >
                      {p.report_count} report{p.report_count !== 1 ? 's' : ''}
                      {p.latest_period && (
                        <span style={{ marginLeft: 8, color: 'var(--color-text-tertiary)' }}>
                          latest: {p.latest_period}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: monoFont,
                      color: 'var(--color-text-ghost)',
                    }}
                  >
                    &rarr;
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

          {/* Loading more indicator */}
          {loadingMore && (
            <div style={{ padding: '12px 0', color: 'var(--color-text-ghost)', fontFamily: monoFont, fontSize: 13 }}>
              loading...
            </div>
          )}
        </>
      )}
    </div>
  );
}
