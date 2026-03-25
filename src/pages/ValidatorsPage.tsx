import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { NetworkSlug } from '@/types/api';
import { useStats } from '@/hooks/useStats';
import { Layout } from '@/components/Layout';
import { NetworkTag } from '@/components/NetworkTag';

const BASE_URL = import.meta.env.VITE_API_URL || '';

interface ValidatorSummary {
  network: NetworkSlug;
  address: string;
  moniker: string | null;
  event_count: number;
  ongoing_count: number;
  last_event_at: string;
}

interface PaginationInfo {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
}

export default function ValidatorsPage() {
  const { stats } = useStats();
  const [validators, setValidators] = useState<ValidatorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (cur?: string) => {
    const qs = new URLSearchParams({ limit: '50' });
    if (cur) qs.set('cursor', cur);
    const res = await fetch(`${BASE_URL}/v1/validators?${qs}`);
    const json = await res.json() as { data: ValidatorSummary[]; pagination: PaginationInfo };
    return json;
  }, []);

  // Initial load
  useEffect(() => {
    fetchPage()
      .then(json => {
        setValidators(json.data);
        setHasMore(json.pagination.has_more);
        setCursor(json.pagination.next_cursor);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchPage]);

  // Load more
  const loadMore = useCallback(() => {
    if (!cursor || !hasMore) return;
    fetchPage(cursor)
      .then(json => {
        setValidators(prev => [...prev, ...json.data]);
        setHasMore(json.pagination.has_more);
        setCursor(json.pagination.next_cursor);
      })
      .catch(() => {});
  }, [cursor, hasMore, fetchPage]);

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
    <Layout stats={stats}>
      <div style={{ marginTop: 8 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.02em',
            marginBottom: 16,
            color: 'var(--color-text-primary)',
          }}
        >
          validators by incident count
        </h2>

        {loading && (
          <div style={{ color: 'var(--color-text-dim)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
            loading...
          </div>
        )}

        {!loading && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border-medium)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11 }}>Validator</th>
                <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11, width: 80, textAlign: 'right' }}>Events</th>
                <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11, width: 80, textAlign: 'right' }}>Ongoing</th>
              </tr>
            </thead>
            <tbody>
              {validators.map(v => (
                <tr
                  key={`${v.network}:${v.address}`}
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <td style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <NetworkTag network={v.network} />
                      <Link
                        to={`/validator/${v.network}/${v.address}`}
                        style={{
                          color: 'var(--color-text-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {v.moniker || v.address.slice(0, 8) + '...' + v.address.slice(-4)}
                      </Link>
                    </div>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {v.event_count}
                  </td>
                  <td
                    style={{
                      padding: '10px 0',
                      textAlign: 'right',
                      color: v.ongoing_count > 0 ? '#e8a735' : 'var(--color-text-dim)',
                      fontWeight: v.ongoing_count > 0 ? 600 : 400,
                    }}
                  >
                    {v.ongoing_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

        <div style={{ marginTop: 24, color: 'var(--color-text-dim)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          {!loading && `${validators.length} validators`}
        </div>
      </div>
    </Layout>
  );
}
