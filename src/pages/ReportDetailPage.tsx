import { useParams, Link } from 'react-router-dom';
import { useReport } from '@/hooks/useReport';
import { useIsMobile } from '@/hooks/useIsMobile';
import { NETWORK_META } from '@/lib/constants';
import type { NetworkSlug, NetworkBreakdown } from '@/types/api';
import { useState } from 'react';

const monoFont = "'JetBrains Mono', monospace";

function NetworkCard({ slug, breakdown }: { slug: string; breakdown: NetworkBreakdown }) {
  const meta = NETWORK_META[slug as NetworkSlug];
  const color = meta?.color ?? 'var(--color-text-secondary)';
  const name = meta?.name ?? slug;

  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        padding: '16px 20px',
        background: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color,
          marginBottom: 12,
          textTransform: 'uppercase',
          fontFamily: monoFont,
          letterSpacing: '0.06em',
        }}
      >
        {name}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <Stat label="validators tracked" value={breakdown.validators_tracked} />
        <Stat label="total events" value={breakdown.total_events} />
        <Stat label="severity score" value={breakdown.severity_score} />
        {breakdown.total_stake && <Stat label="total stake" value={breakdown.total_stake} />}
        {breakdown.uptime_estimate_pct != null && (
          <Stat label="uptime estimate" value={`${breakdown.uptime_estimate_pct}%`} />
        )}
      </div>

      {Object.keys(breakdown.events_by_type).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={labelStyle}>events by type</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {Object.entries(breakdown.events_by_type).map(([type, count]) => (
              <span
                key={type}
                style={{
                  fontSize: 11,
                  fontFamily: monoFont,
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-bg-surface)',
                  padding: '3px 8px',
                  borderRadius: 3,
                }}
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {breakdown.worst_incident && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-dim)' }}>
          <span style={labelStyle}>worst incident: </span>
          <span style={{ color: breakdown.worst_incident.severity === 'critical' ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
            {breakdown.worst_incident.event_type}
          </span>
          {' at '}
          {new Date(breakdown.worst_incident.started_at).toLocaleDateString()}
          {' '}
          <Link
            to={`/validator/${slug}/${breakdown.worst_incident.validator_address}`}
            style={{ color, textDecoration: 'none', fontFamily: monoFont, fontSize: 11 }}
          >
            {breakdown.worst_incident.validator_address.slice(0, 12)}...
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          fontFamily: monoFont,
          color: 'var(--color-text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontFamily: monoFont,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-text-ghost)',
  marginBottom: 2,
};

export default function ReportDetailPage() {
  const { providerSlug } = useParams<{ providerSlug: string }>();
  const isMobile = useIsMobile();
  const { report, loading, error } = useReport(providerSlug ?? '');
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        Loading report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--color-text-dim)', fontSize: 13 }}>
        {error === 'API error: 404' ? 'No report found for this provider.' : 'having trouble reaching the api — retrying'}
      </div>
    );
  }

  const { report: data } = report;
  const networks = Object.entries(data.networks).sort(([a], [b]) => a.localeCompare(b));

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ padding: isMobile ? '0' : undefined }}>
      {/* Back link */}
      <Link
        to="/reports"
        style={{
          fontSize: 12,
          fontFamily: monoFont,
          color: 'var(--color-text-dim)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 16,
        }}
      >
        &larr; all reports
      </Link>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.04em',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {report.provider_name}
          </h1>
          <div
            style={{
              fontSize: 12,
              fontFamily: monoFont,
              color: 'var(--color-text-dim)',
              marginTop: 4,
            }}
          >
            {report.period} &middot; generated{' '}
            {new Date(report.generated_at).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={handleShare}
          style={{
            fontSize: 11,
            fontFamily: monoFont,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: 3,
          }}
        >
          {copied ? 'copied!' : 'share report'}
        </button>
      </div>

      {/* Cross-chain summary */}
      <div
        style={{
          padding: '20px',
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 16,
        }}
      >
        <div style={{ ...labelStyle, marginBottom: 12 }}>cross-chain summary</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          <Stat label="validators" value={data.cross_chain_summary.total_validators} />
          <Stat label="incidents" value={data.cross_chain_summary.total_events} />
          <Stat label="severity score" value={data.cross_chain_summary.aggregate_severity_score} />
          {data.cross_chain_summary.aggregate_stake_at_risk && (
            <Stat label="stake at risk" value={data.cross_chain_summary.aggregate_stake_at_risk} />
          )}
        </div>
      </div>

      {/* Per-network breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {networks.map(([slug, breakdown]) => (
          <NetworkCard key={slug} slug={slug} breakdown={breakdown} />
        ))}
      </div>

      {networks.length === 0 && (
        <div style={{ padding: '20px 0', color: 'var(--color-text-dim)', fontSize: 13 }}>
          No network data in this report.
        </div>
      )}
    </div>
  );
}
