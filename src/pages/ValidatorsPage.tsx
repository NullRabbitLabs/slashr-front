import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { EventListItem } from '@/types/api';
import { fetchEvents } from '@/api/client';
import { useStats } from '@/hooks/useStats';
import { Layout } from '@/components/Layout';
import { NetworkTag } from '@/components/NetworkTag';

interface ValidatorRow {
  network: EventListItem['network'];
  address: string;
  moniker: string | null;
  count: number;
  ongoing: number;
  lastSeen: string;
}

export default function ValidatorsPage() {
  const { stats } = useStats();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all events by paginating through
  useEffect(() => {
    let cancelled = false;
    const all: EventListItem[] = [];

    async function fetchAll(cursor?: string) {
      const res = await fetchEvents({ limit: 50, cursor });
      if (cancelled) return;
      all.push(...res.data);
      if (res.pagination.has_more && res.pagination.next_cursor) {
        await fetchAll(res.pagination.next_cursor);
      } else {
        setEvents(all);
        setLoading(false);
      }
    }

    fetchAll().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const validators = useMemo(() => {
    const map = new Map<string, ValidatorRow>();
    for (const e of events) {
      const key = `${e.network}:${e.validator_address}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (!e.resolved_at) existing.ongoing++;
        if (e.started_at > existing.lastSeen) existing.lastSeen = e.started_at;
      } else {
        map.set(key, {
          network: e.network,
          address: e.validator_address,
          moniker: e.validator_moniker,
          count: 1,
          ongoing: e.resolved_at ? 0 : 1,
          lastSeen: e.started_at,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [events]);

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
                    {v.count}
                  </td>
                  <td
                    style={{
                      padding: '10px 0',
                      textAlign: 'right',
                      color: v.ongoing > 0 ? '#e8a735' : 'var(--color-text-dim)',
                      fontWeight: v.ongoing > 0 ? 600 : 400,
                    }}
                  >
                    {v.ongoing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 24, color: 'var(--color-text-dim)', fontSize: 12 }}>
          {!loading && `${validators.length} validators across ${events.length} events`}
        </div>
      </div>
    </Layout>
  );
}
