import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { NetworkDirectoryResponse } from '@/types/api';
import { useNetworks } from '@/hooks/useNetworks';
import { useNetworkValidators } from '@/hooks/useNetworkValidators';
import { formatDate } from '@/lib/time';

const GRID = 'minmax(200px,2fr) 150px minmax(160px,1fr)';

function fmtStake(stake: number | null, token: string | null): string {
  if (stake == null) return 'n/a';
  return `${Math.round(stake).toLocaleString('en-US')}${token ? ` ${token}` : ''}`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The single validator directory: every validator on a network, clean ones
 * included, with its honest track record. Backs both `/validators` (defaulting
 * to a primary network) and `/networks/:network/validators` (scoped by the
 * route param). Network pills switch the active chain client-side. Risk-ranked
 * data lives separately at `/risk`.
 */
export default function DirectoryPage({
  initialNetwork,
  initialData,
}: {
  initialNetwork: string;
  initialData: NetworkDirectoryResponse | null;
}) {
  const [net, setNet] = useState(initialNetwork);
  const [query, setQuery] = useState('');
  const { networks } = useNetworks();
  const { validators, monitoringSince, loading } = useNetworkValidators(
    net,
    net === initialNetwork ? initialData : null,
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return validators;
    return validators.filter(
      v => (v.moniker ?? '').toLowerCase().includes(q) || v.address.toLowerCase().includes(q),
    );
  }, [validators, query]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', margin: '0 0 4px' }}>
          Validator directory
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          Every validator we track on {titleCase(net)}, clean or not.
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
          {networks.map(n => (
            <button
              key={n.slug}
              onClick={() => setNet(n.slug)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${n.slug === net ? 'var(--accent)' : 'var(--border)'}`,
                background: n.slug === net ? 'var(--accent)' : 'var(--surface)',
                color: n.slug === net ? '#fff' : 'var(--text-2)',
              }}
            >
              {n.name}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '0 11px', height: 36, width: 240 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search validator or address" style={{ border: 'none', outline: 'none', background: 'none', font: 'inherit', fontSize: 13, color: 'var(--text)', width: '100%' }} />
        </div>
      </div>

      <div className="rd-table-scroll">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', overflow: 'hidden', minWidth: 640 }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 16, padding: '14px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            <span>Validator</span>
            <span style={{ textAlign: 'right' }}>Total staked</span>
            <span style={{ textAlign: 'right' }}>Track record</span>
          </div>

          {!loading && rows.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {validators.length === 0 ? 'No validators registered yet.' : 'No validators match your search.'}
            </div>
          )}

          {rows.map(v => {
            const badge = v.clean
              ? { text: 'No incidents recorded', color: 'var(--ok)', bg: 'var(--ok-soft)' }
              : { text: `${v.incident_count} incident${v.incident_count !== 1 ? 's' : ''}`, color: 'var(--crit)', bg: 'var(--crit-soft)' };
            return (
              <Link
                key={v.address}
                to={`/validator/${net}/${encodeURIComponent(v.address)}`}
                className="risk-row"
                style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: 16, padding: '16px 22px', borderBottom: '1px solid var(--border)', boxShadow: `inset 3px 0 0 ${v.clean ? 'var(--ok)' : 'var(--crit)'}`, textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.moniker || v.address}
                  </div>
                  <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.address}
                  </div>
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
