import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { NetworkSlug } from '@/types/api';
import { NETWORK_ORDER } from '@/lib/constants';
import { useStats } from '@/hooks/useStats';
import { useNetworks } from '@/hooks/useNetworks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Layout } from '@/components/Layout';
import { NetworkStrip } from '@/components/NetworkStrip';
import { Explainer } from '@/components/Explainer';
import { FeedFilter } from '@/components/FeedFilter';
import { EventFeed } from '@/components/EventFeed';

export default function FeedPage() {
  const [searchParams] = useSearchParams();
  const { stats } = useStats();
  const { networks } = useNetworks();

  const initialCursor = searchParams.get('cursor');

  // Client-side filter state
  const [activeNetworks, setActiveNetworks] = useState<Set<NetworkSlug>>(
    () => new Set(NETWORK_ORDER),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const handleToggleNetwork = useCallback((slug: NetworkSlug) => {
    setActiveNetworks(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        if (next.size <= 1) return prev; // at least one must remain
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  // Derive network param for API: null when all active, comma-separated otherwise
  const networkParam = useMemo(() => {
    if (activeNetworks.size === NETWORK_ORDER.length) return null;
    return Array.from(activeNetworks).join(',');
  }, [activeNetworks]);

  // Only send search to API if >= 2 chars (API rejects shorter)
  const searchParam = debouncedSearch.length >= 2 ? debouncedSearch : '';

  return (
    <Layout stats={stats}>
      <NetworkStrip
        stats={stats}
        networks={networks}
      />
      <Explainer />

      <p
        style={{
          fontSize: 13,
          color: 'var(--color-text-tertiary)',
          fontStyle: 'italic',
          margin: '0 0 20px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Your staking rewards depend on your validator staying online. Here&rsquo;s every time one didn&rsquo;t.
      </p>

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
    </Layout>
  );
}
