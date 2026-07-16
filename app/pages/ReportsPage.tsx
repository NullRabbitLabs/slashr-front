import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router';
import { useReportProviders, type ReportProvidersResponse } from '@/hooks/useReportProviders';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageMeta } from '@/hooks/usePageMeta';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface ReportsPageProps {
  initialProviders?: ReportProvidersResponse | null;
}

export default function ReportsPage({ initialProviders }: ReportsPageProps = {}) {
  usePageMeta({
    title: 'Reliability Reports · slashr',
    description: 'Monthly validator reliability reports by staking operator.',
  });
  const [searchInput, setSearchInput] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const apiSearch = debouncedSearch.length >= 2 ? debouncedSearch : undefined;
  const apiLetter = activeLetter ?? undefined;

  const { providers, loading, loadingMore, error, hasMore, loadMore } = useReportProviders(
    apiSearch,
    apiLetter,
    initialProviders,
  );

  const filteredProviders = useMemo(() => {
    if (!searchInput.trim()) return providers;
    const q = searchInput.toLowerCase();
    return providers.filter(p => p.provider_name.toLowerCase().includes(q));
  }, [providers, searchInput]);

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

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '4px 9px',
    borderRadius: 7,
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text-2)',
    minWidth: 26,
  });

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', margin: '0 0 4px' }}>
            Reliability reports
          </h1>
          <Link to="/reports/api" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            API &amp; delivery →
          </Link>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          Monthly reliability reports by staking operator: incidents, uptime, and track record.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 11px', height: 36, width: 260 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search operator"
            style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', fontSize: 13, color: 'var(--text)', width: '100%' }}
          />
        </div>
        {!loading && !error && (
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            {filteredProviders.length} operator{filteredProviders.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
        <button onClick={handleClearAll} style={pill(!activeLetter)}>All</button>
        {LETTERS.map(letter => (
          <button key={letter} onClick={() => handleLetterClick(letter)} style={pill(activeLetter === letter)}>
            {letter}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
          Having trouble reaching the API, retrying.
        </div>
      )}

      {!error && (
        <div className="rd-table-scroll">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            {loading && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
            )}

            {!loading && filteredProviders.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                {apiSearch || apiLetter ? 'No operators found.' : 'No reliability reports generated yet.'}
              </div>
            )}

            {!loading &&
              filteredProviders.map(p => (
                <Link
                  key={p.provider_slug}
                  to={`/reports/${p.provider_slug}`}
                  className="risk-row"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '15px 22px', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.provider_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {p.report_count} report{p.report_count !== 1 ? 's' : ''}
                      {p.latest_period && <span style={{ marginLeft: 8 }}>latest {p.latest_period}</span>}
                    </div>
                  </div>
                  <span aria-hidden="true" style={{ fontSize: 15, color: 'var(--text-3)', flex: 'none' }}>→</span>
                </Link>
              ))}

            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
            {loadingMore && (
              <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
