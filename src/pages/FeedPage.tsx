import { useState } from 'react';
import type { NetworkSlug } from '@/types/api';
import { useStats } from '@/hooks/useStats';
import { useNetworks } from '@/hooks/useNetworks';
import { Layout } from '@/components/Layout';
import { NetworkStrip } from '@/components/NetworkStrip';
import { Explainer } from '@/components/Explainer';
import { EventFeed } from '@/components/EventFeed';

export default function FeedPage() {
  const [activeNetwork, setActiveNetwork] = useState<NetworkSlug | null>(null);
  const { stats } = useStats();
  const { networks } = useNetworks();

  return (
    <Layout stats={stats}>
      <NetworkStrip
        activeNetwork={activeNetwork}
        onFilterChange={setActiveNetwork}
        stats={stats}
        networks={networks}
      />
      <Explainer />
      <EventFeed network={activeNetwork} onFilterChange={setActiveNetwork} />
    </Layout>
  );
}
