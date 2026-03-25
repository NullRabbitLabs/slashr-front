import { useState, useEffect } from 'react';
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

export default function ValidatorsPage() {
  const { stats } = useStats();
  const [validators, setValidators] = useState<ValidatorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/v1/validators`)
      .then(res => res.json())
      .then((res: { data: ValidatorSummary[] }) => setValidators(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

        <div style={{ marginTop: 24, color: 'var(--color-text-dim)', fontSize: 12 }}>
          {!loading && `${validators.length} validators`}
        </div>
      </div>
    </Layout>
  );
}
