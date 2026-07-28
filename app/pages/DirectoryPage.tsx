import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { NetworkDirectoryResponse, NetworkInfo, NetworkValidatorItem } from '@/types/api';
import { fetchNetworkValidators } from '@/api/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDate } from '@/lib/time';

const GRID = 'minmax(200px,2fr) 150px minmax(160px,1fr)';

function fmtStake(stake: number | null, token: string | null): string {
  if (stake == null) return 'n/a';
  return `${Math.round(stake).toLocaleString('en-US')}${token ? ` ${token}` : ''}`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type SortCol = 'validator' | 'stake' | 'track';

/**
 * The single validator directory: every validator on a network, clean ones
 * included, with its honest track record (operational incidents only). Backs
 * both `/validators` (defaulting to a primary network) and
 * `/networks/:network/validators`. Network pills are real links to each
 * network's directory. Risk-ranked data lives separately at `/risk`.
 */
export default function DirectoryPage({
  network,
  data,
  networks,
}: {
  network: string;
  data: NetworkDirectoryResponse | null;
  networks: NetworkInfo[];
}) {
  const [query, setQuery] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('stake');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loaded = data?.validators ?? [];
  const monitoringSince = data?.monitoring_since ?? null;

  // Server-side search: the loaded page is only the top of a stake-ranked,
  // paginated directory, so a lower-ranked validator can't be found by filtering
  // it client-side. When the user types (>=2 chars), query the server for the
  // match across the whole directory. The client filter below still runs for
  // instant feedback over the loaded page while the request is in flight.
  const [serverResults, setServerResults] = useState<NetworkValidatorItem[] | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  useEffect(() => {
    let cancelled = false;
    if (debouncedQuery.length < 2) {
      setServerResults(null);
      return;
    }
    fetchNetworkValidators(network, { search: debouncedQuery, limit: 50 })
      .then(res => {
        if (!cancelled) setServerResults(res.validators ?? []);
      })
      .catch(() => {
        if (!cancelled) setServerResults(null); // degrade to the loaded page
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, network]);

  const validators = serverResults ?? loaded;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? validators.filter(
          v => (v.moniker ?? '').toLowerCase().includes(q) || v.address.toLowerCase().includes(q),
        )
      : validators.slice();
    filtered.sort((a, b) => {
      let c = 0;
      if (sortCol === 'validator') {
        c = (a.moniker || a.address).localeCompare(b.moniker || b.address);
      } else if (sortCol === 'stake') {
        c = (a.stake ?? -1) - (b.stake ?? -1);
      } else {
        // Track record: clean validators first, then fewest incidents.
        const av = a.clean ? -1 : a.incident_count;
        const bv = b.clean ? -1 : b.incident_count;
        c = av - bv;
      }
      return sortDir === 'asc' ? c : -c;
    });
    return filtered;
  }, [validators, query, sortCol, sortDir]);

  const toggleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'validator' ? 'asc' : 'desc');
    }
  };
  const arrow = (col: SortCol) => (sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  const headerCell = (col: SortCol, label: string, align: 'left' | 'right'): React.CSSProperties => ({
    textAlign: align,
    justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: sortCol === col ? 'var(--text)' : 'var(--text-3)',
    cursor: 'pointer',
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', margin: '0 0 4px' }}>
          Validator directory
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          Every validator we track on {titleCase(network)}, clean or not.
          {monitoringSince && (
            <>
              {' '}A clean validator shows{' '}
              <strong style={{ color: 'var(--text)' }}>
                no incidents recorded since {formatDate(monitoringSince)}
              </strong>
              .
            </>
          )}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {networks.map(n => {
            const active = n.slug === network;
            return (
              <Link
                key={n.slug}
                to={`/networks/${n.slug}/validators`}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text-2)',
                }}
              >
                {n.name}
              </Link>
            );
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 11px', height: 36, width: 240 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search validator or address" style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', fontSize: 13, color: 'var(--text)', width: '100%' }} />
        </div>
      </div>

      <div className="rd-table-scroll">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden', minWidth: 640 }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 16, padding: '14px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <button onClick={() => toggleSort('validator')} style={headerCell('validator', 'Validator', 'left')}>Validator{arrow('validator')}</button>
            <button onClick={() => toggleSort('stake')} style={headerCell('stake', 'Total staked', 'right')}>Total staked{arrow('stake')}</button>
            <button onClick={() => toggleSort('track')} style={headerCell('track', 'Track record', 'right')}>Track record{arrow('track')}</button>
          </div>

          {rows.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {query.trim() ? 'No validators match your search.' : 'No validators registered yet.'}
            </div>
          )}

          {rows.map(v => {
            const badge = v.clean
              ? { text: 'No incidents recorded', color: 'var(--ok)', bg: 'var(--ok-soft)' }
              : { text: `${v.incident_count} incident${v.incident_count !== 1 ? 's' : ''}`, color: 'var(--crit)', bg: 'var(--crit-soft)' };
            return (
              <Link
                key={v.address}
                to={`/validator/${network}/${encodeURIComponent(v.address)}`}
                className="risk-row"
                style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: 16, padding: '16px 22px', borderBottom: '1px solid var(--border)', boxShadow: `inset 3px 0 0 ${v.clean ? 'var(--ok)' : 'var(--crit)'}`, textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ minWidth: 0 }}>
                  {v.moniker ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.moniker}
                      </div>
                      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.address}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.address}
                    </div>
                  )}
                </div>
                <span style={{ textAlign: 'right', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtStake(v.stake, v.stake_token)}
                </span>
                <span style={{ justifySelf: 'end', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: badge.color, background: badge.bg }}>
                  {v.clean && <span aria-hidden="true">&#10003;</span>}
                  {badge.text}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
