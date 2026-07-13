import { useEffect, useRef } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { EventRow } from './EventRow';

interface EventFeedProps {
  network: string | null;
  search: string;
  initialCursor?: string | null;
  onCursorChange?: (cursor: string | null) => void;
  showResultCount?: boolean;
}

export function EventFeed({ network, search, initialCursor, onCursorChange, showResultCount = true }: EventFeedProps) {
  const { events, loading, error, hasMore, loadMore, loadingMore, visibleIds } = useEvents({
    network,
    search,
    initialCursor,
    onCursorChange,
  });
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

      {/* Result count */}
      {showResultCount && !loading && events.length > 0 && search.length > 0 && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '4px 0 8px',
          }}
        >
          Showing {events.length}{hasMore ? '+' : ''} result{events.length !== 1 ? 's' : ''} for &lsquo;{search}&rsquo;
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
        />
      ))}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {/* Load more button */}
      {hasMore && !loadingMore && (
        <button
          onClick={loadMore}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 0',
            marginTop: 8,
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            color: 'var(--color-text-dim)',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--color-border-hover)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.color = '';
          }}
        >
          load more
        </button>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div
          style={{
            padding: '12px 0',
            color: 'var(--color-text-ghost)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          loading...
        </div>
      )}
    </div>
  );
}
