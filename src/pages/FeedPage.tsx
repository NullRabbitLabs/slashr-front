import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { NetworkSlug } from '@/types/api';
import { NETWORK_ORDER } from '@/lib/constants';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageMeta } from '@/hooks/usePageMeta';
import { FeedFilter } from '@/components/FeedFilter';
import { EventFeed } from '@/components/EventFeed';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function FeedPage() {
  const isMobile = useIsMobile();
  usePageMeta({
    title: 'slashr \u2014 live validator incident feed',
    description: 'Real-time slashing, delinquency, and missed vote tracking across Solana, Ethereum, Sui, and Cosmos.',
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCursor = searchParams.get('cursor');

  const [activeNetworks, setActiveNetworks] = useState<Set<NetworkSlug>>(
    () => new Set(NETWORK_ORDER),
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (debouncedSearch.length >= 2) {
        next.set('q', debouncedSearch);
      } else {
        next.delete('q');
      }
      return next;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  const handleToggleNetwork = useCallback((slug: NetworkSlug) => {
    setActiveNetworks(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        if (next.size <= 1) return prev;
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const networkParam = useMemo(() => {
    if (activeNetworks.size === NETWORK_ORDER.length) return null;
    return Array.from(activeNetworks).join(',');
  }, [activeNetworks]);

  const searchParam = debouncedSearch.length >= 2 ? debouncedSearch : '';

  return (
    <>
      {!isMobile && (
        <div
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-dim)',
            marginBottom: 4,
          }}
        >
          Live Feed
        </div>
      )}

      <FeedFilter
        activeNetworks={activeNetworks}
        onToggleNetwork={handleToggleNetwork}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <EventFeed
        network={networkParam}
        search={searchParam}
        initialCursor={initialCursor}
      />
    </>
  );
}
