import type { NetworkSlug } from '@/types/api';
import { useEvents } from '@/hooks/useEvents';
import { EventRow } from './EventRow';

interface EventFeedProps {
  network: NetworkSlug | null;
  onFilterChange: (network: NetworkSlug | null) => void;
}

export function EventFeed({ network, onFilterChange }: EventFeedProps) {
  const { events, loading, error, hasMore, loadMore, visibleIds } = useEvents(network);

  return (
    <div>
      {/* Feed header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          padding: '0 0 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          live feed
        </span>
        {network && (
          <button
            className="btn-ghost"
            onClick={() => onFilterChange(null)}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3,
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              padding: '1px 8px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            clear filter &times;
          </button>
        )}
      </div>

      {/* Error line */}
      {error && !loading && (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '8px 0',
          }}
        >
          having trouble reaching the api &mdash; retrying
        </div>
      )}

      {/* Event rows */}
      {events.map(event => (
        <EventRow
          key={event.id}
          event={event}
          visible={visibleIds.has(event.id)}
        />
      ))}

      {/* Load more */}
      {hasMore && (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <button
            className="btn-ghost"
            onClick={loadMore}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4,
              color: 'rgba(255,255,255,0.45)',
              fontSize: 12,
              padding: '10px 32px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.03em',
              transition: 'border-color 0.2s',
            }}
          >
            load more
          </button>
        </div>
      )}
    </div>
  );
}
