import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { NetworkSlug } from '@/types/api';
import { NETWORK_ORDER } from '@/lib/constants';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageMeta } from '@/hooks/usePageMeta';
import { FeedFilter } from '@/components/FeedFilter';
import { EventFeed } from '@/components/EventFeed';

export default function FeedPage() {
  usePageMeta({
    title: 'slashr \u2014 live validator incident feed',
    description: 'Real-time slashing, delinquency, and missed vote tracking across Solana, Ethereum, Sui, and Cosmos.',
  });
  const [searchParams] = useSearchParams();

  const initialCursor = searchParams.get('cursor');

  const [activeNetworks, setActiveNetworks] = useState<Set<NetworkSlug>>(
    () => new Set(NETWORK_ORDER),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

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
