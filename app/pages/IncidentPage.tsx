import { usePageMeta } from '@/hooks/usePageMeta';
import type { IncidentDetail, IncidentStatus, IncidentUpdate } from '@/types/api';

/**
 * A single tracked incident: what we detected, what we said while it ran, and
 * how it ended.
 *
 * This is the page every breaking tweet links to. A tweet is 280 characters and
 * frozen at the moment it was posted; during an event people want to know what
 * is happening NOW and what has changed since. That gap is what made the
 * 2026-07-28 Solana alert a dead end. The timeline below is the same ledger the
 * Twitter thread is built from (slasher.incident_updates), so the page and the
 * thread can never disagree.
 *
 * Deliberately honest about uncertainty: a retracted incident says plainly that
 * we could not confirm it rather than quietly disappearing.
 */

// Detector kinds are internal codes and are never rendered raw, same rule as
// event_type on the feed.
const KIND_LABELS: Record<string, string> = {
  mass_down_burst: 'Correlated outage',
  slash_burst: 'Slashing cascade',
  mass_outage: 'Correlated outage',
  exit_wave: 'Exit wave',
  commission_cluster: 'Coordinated commission move',
  whale_down: 'Large validator offline',
  real_slash: 'Slashing',
  volume_anomaly: 'Unusual activity',
};

function incidentKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? 'Incident';
}

// What each status means to a reader, in plain words. The wording matters: a
// retraction has to read as a correction, not as a shrug.
const STATUS_META: Record<IncidentStatus, { label: string; blurb: string; color: string }> = {
  active: {
    label: 'Ongoing',
    blurb: 'This incident is still open. We are tracking it and this page updates as it develops.',
    color: 'var(--danger, #d92d20)',
  },
  resolved: {
    label: 'Resolved',
    blurb: 'The affected validators have recovered. The duration below is measured from the first event to the observed recovery.',
    color: 'var(--success, #067647)',
  },
  retracted: {
    label: 'Unconfirmed',
    blurb: 'The signal cleared before we could confirm a sustained incident, and no recovery was recorded. Treat the original alert as unconfirmed.',
    color: 'var(--text-3)',
  },
};

const UPDATE_LABELS: Record<string, string> = {
  open: 'Detected',
  growth: 'Escalated',
  status: 'Update',
  resolve: 'Resolved',
  retract: 'Retracted',
};

function capChain(slug: string | null): string {
  if (!slug) return 'Multiple chains';
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function fmtDuration(seconds: number | null): string | null {
  if (seconds === null || seconds < 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 48) return rem ? `${hours}h ${rem}m` : `${hours}h`;
  return `${Math.floor(hours / 24)} days`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  boxShadow: 'var(--shadow)',
  overflow: 'hidden',
};

const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '-.02em',
  color: 'var(--text)',
  margin: '36px 0 10px',
};

const p: React.CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.65,
  color: 'var(--text-2)',
  margin: '0 0 12px',
};

const statLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
  marginBottom: 6,
};

const statValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '-.02em',
  color: 'var(--text)',
  fontVariantNumeric: 'tabular-nums',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '16px 18px' }}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function TimelineRow({ update, isLast }: { update: IncidentUpdate; isLast: boolean }) {
  return (
    <li style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: isLast ? 0 : 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <span
          aria-hidden="true"
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: 'var(--accent)',
            marginTop: 6,
          }}
        />
        {!isLast && <span aria-hidden="true" style={{ flex: 1, width: 1, background: 'var(--border)', marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {UPDATE_LABELS[update.kind] ?? update.kind}
          </span>
          <time
            dateTime={update.posted_at}
            style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}
          >
            {fmtTime(update.posted_at)}
          </time>
        </div>
        <p style={{ ...p, margin: '4px 0 0' }}>{update.text}</p>
        {update.tweet_id && (
          <a
            href={`https://twitter.com/SlashrDev/status/${update.tweet_id}`}
            rel="noopener noreferrer"
            style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            View post
          </a>
        )}
      </div>
    </li>
  );
}

export default function IncidentPage({ incident }: { incident: IncidentDetail }) {
  const kind = incidentKindLabel(incident.kind);
  const chain = capChain(incident.chain);
  const status = STATUS_META[incident.status] ?? STATUS_META.active;
  const duration = fmtDuration(incident.duration_seconds);

  usePageMeta({
    title: `${chain} ${kind.toLowerCase()} · ${status.label} · slashr`,
    description: `${kind} on ${chain} starting ${fmtTime(incident.started_at)}. Peak ${incident.peak_magnitude} validators affected. Status: ${status.label}.`,
  });

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: 11,
        }}
      >
        Incident
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)', margin: 0 }}>
          {chain} {kind.toLowerCase()}
        </h1>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: status.color,
            border: `1px solid ${status.color}`,
            borderRadius: 999,
            padding: '3px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          {status.label}
        </span>
      </div>

      <p style={p}>{status.blurb}</p>

      <div
        style={{
          ...card,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          marginTop: 20,
        }}
      >
        <Stat label="Started" value={fmtTime(incident.started_at)} />
        <Stat label="Peak affected" value={String(incident.peak_magnitude)} />
        {incident.status === 'active' ? (
          <Stat label="Still affected" value={String(incident.current_magnitude)} />
        ) : (
          <Stat label="Duration" value={duration ?? 'Not established'} />
        )}
      </div>

      <h2 style={h2}>Timeline</h2>
      <p style={p}>
        Everything we published about this incident, in order. This is the same record our posts are generated
        from, so the thread and this page cannot drift apart.
      </p>
      {incident.updates.length === 0 ? (
        <p style={p}>No updates were published for this incident.</p>
      ) : (
        <div style={{ ...card, padding: '20px 22px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {incident.updates.map((u, i) => (
              <TimelineRow key={`${u.kind}-${u.posted_at}`} update={u} isLast={i === incident.updates.length - 1} />
            ))}
          </ul>
        </div>
      )}

      <h2 style={h2}>How we detect this</h2>
      <p style={p}>
        {incident.kind === 'slash_burst' || incident.kind === 'real_slash' ? (
          <>
            Slashing is an unambiguous on-chain fact, so we report it as soon as we see it. We count distinct
            validators with an equivocation event inside a short rolling window.
          </>
        ) : (
          <>
            We count distinct validators entering downtime inside a short rolling window, and we hold the alert
            until those validators are confirmed to still be offline on a later check. Validators that recover
            immediately are treated as noise and never reported, because brief delinquency is common and does not
            indicate an incident.
          </>
        )}{' '}
        Full detail on the model and its limits is in the{' '}
        <a href="/methodology" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          methodology
        </a>
        .
      </p>
      <p style={{ ...p, fontSize: 13, color: 'var(--text-3)' }}>
        Incident reference: <code>{incident.slug}</code>
      </p>
    </div>
  );
}
