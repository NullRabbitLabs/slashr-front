import { useState, useEffect, useRef, useCallback } from 'react';
import type { EventListItem, NetworkSlug } from '@/types/api';
import { fetchEvents } from '@/api/client';

const POLL_INTERVAL = 30_000;
const STAGGER_DELAY = 120;

export function useEvents(network: NetworkSlug | null) {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const knownIdsRef = useRef<Set<number>>(new Set());
  const pendingQueueRef = useRef<number[]>([]);
  const staggerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stagger reveal: process pending queue at 120ms intervals
  const startStagger = useCallback(() => {
    if (staggerTimerRef.current) return; // already running
    staggerTimerRef.current = setInterval(() => {
      const nextId = pendingQueueRef.current.shift();
      if (nextId !== undefined) {
        setVisibleIds(prev => new Set([...prev, nextId]));
      } else {
        if (staggerTimerRef.current) clearInterval(staggerTimerRef.current);
        staggerTimerRef.current = null;
      }
    }, STAGGER_DELAY);
  }, []);

  // Initial fetch + filter change
  useEffect(() => {
    let cancelled = false;

    // Reset everything on filter change
    setEvents([]);
    setVisibleIds(new Set());
    setLoading(true);
    setError(null);
    setCursor(null);
    setHasMore(false);
    knownIdsRef.current = new Set();
    pendingQueueRef.current = [];
    if (staggerTimerRef.current) {
      clearInterval(staggerTimerRef.current);
      staggerTimerRef.current = null;
    }

    fetchEvents({ network: network ?? undefined, limit: 50 })
      .then(res => {
        if (cancelled) return;
        const newEvents = res.data;
        setEvents(newEvents);
        setHasMore(res.pagination.has_more);
        setCursor(res.pagination.next_cursor);

        const ids = new Set(newEvents.map(e => e.id));
        knownIdsRef.current = ids;

        // Queue all for stagger
        pendingQueueRef.current = newEvents.map(e => e.id);
        startStagger();
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [network, startStagger]);

  // Polling
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState !== 'visible') return;

      fetchEvents({ network: network ?? undefined, limit: 50 })
        .then(res => {
          const newItems = res.data.filter(e => !knownIdsRef.current.has(e.id));
          if (newItems.length > 0) {
            // Prepend new events
            setEvents(prev => [...newItems, ...prev]);
            for (const e of newItems) {
              knownIdsRef.current.add(e.id);
            }
            // Queue new events for stagger
            pendingQueueRef.current.push(...newItems.map(e => e.id));
            startStagger();
          }
          setError(null);
        })
        .catch(err => {
          setError((err as Error).message);
        });
    };

    const intervalId = setInterval(poll, POLL_INTERVAL);

    // Also poll immediately when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [network, startStagger]);

  // Cleanup stagger timer on unmount
  useEffect(() => {
    return () => {
      if (staggerTimerRef.current) clearInterval(staggerTimerRef.current);
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!cursor || !hasMore) return;

    fetchEvents({ network: network ?? undefined, cursor, limit: 50 })
      .then(res => {
        const appended = res.data;
        setEvents(prev => [...prev, ...appended]);
        setHasMore(res.pagination.has_more);
        setCursor(res.pagination.next_cursor);

        for (const e of appended) {
          knownIdsRef.current.add(e.id);
        }
        // Stagger appended events too
        pendingQueueRef.current.push(...appended.map(e => e.id));
        startStagger();
      })
      .catch(err => {
        setError((err as Error).message);
      });
  }, [cursor, hasMore, network, startStagger]);

  return { events, loading, error, hasMore, loadMore, visibleIds };
}
