import { useEffect, useRef } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useEventTypes } from '@/hooks/useEventTypes';
import { EventRow } from './EventRow';

interface EventFeedProps {
  network: string | null;
  search: string;
  initialCursor?: string | null;
  onCursorChange?: (cursor: string | null) => void;
}

export function EventFeed({ network, search, initialCursor, onCursorChange }: EventFeedProps) {
  const { events, loading, error, hasMore, loadMore, visibleIds } = useEvents({
    network,
    search,
    initialCursor,
    onCursorChange,
  });
  const { lookup: eventTypeLookup } = useEventTypes();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: trigger loadMore when sentinel enters viewport
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

  const isFiltered = network != null || search.length > 0;

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
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--color-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          live feed
        </span>
      </div>

      {/* Error line */}
      {error && !loading && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '8px 0',
          }}
        >
          having trouble reaching the api &mdash; retrying
        </div>
      )}

      {/* Empty filter result */}
      {events.length === 0 && !loading && isFiltered && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '24px 0',
          }}
        >
          no matching events
        </div>
      )}

      {/* Event rows */}
      {events.map(event => (
        <EventRow
          key={event.id}
          event={event}
          visible={visibleIds.has(event.id)}
          eventTypeLookup={eventTypeLookup}
        />
      ))}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
}
