import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { NetworkSlug } from '@/types/api';
import { useStats } from '@/hooks/useStats';
import { useNetworks } from '@/hooks/useNetworks';
import { Layout } from '@/components/Layout';
import { NetworkStrip } from '@/components/NetworkStrip';
import { Explainer } from '@/components/Explainer';
import { EventFeed } from '@/components/EventFeed';

const VALID_NETWORKS = new Set<string>(['solana', 'ethereum', 'cosmos', 'sui', 'polkadot']);

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { stats } = useStats();
  const { networks } = useNetworks();

  const networkParam = searchParams.get('network');
  const activeNetwork = networkParam && VALID_NETWORKS.has(networkParam)
    ? (networkParam as NetworkSlug)
    : null;
  const initialCursor = searchParams.get('cursor');

  const handleFilterChange = useCallback((slug: NetworkSlug | null) => {
    setSearchParams(slug ? { network: slug } : {}, { replace: false });
  }, [setSearchParams]);

  const handleCursorChange = useCallback((cursor: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (cursor) {
        next.set('cursor', cursor);
      } else {
        next.delete('cursor');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return (
    <Layout stats={stats}>
      <NetworkStrip
        activeNetwork={activeNetwork}
        onFilterChange={handleFilterChange}
        stats={stats}
        networks={networks}
      />
      <Explainer />
      <EventFeed
        network={activeNetwork}
        onFilterChange={handleFilterChange}
        initialCursor={initialCursor}
        onCursorChange={handleCursorChange}
      />
    </Layout>
  );
}
