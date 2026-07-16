import { useMemo } from 'react';
import type { NetworkSlug } from '@/types/api';
import { NETWORK_ORDER } from '@/lib/constants';
import { useNetworks } from './useNetworks';

/**
 * Returns NETWORK_ORDER filtered to the networks the API currently exposes.
 *
 * Background: NETWORK_ORDER is a static const that lists every chain we
 * have UI assets for (color, ticker, label). The API gates some chains
 * via `networks.is_public=false` (migration 052) - and unlocks them per
 * request when `?preview=all` is on the URL. The dynamic /v1/networks
 * endpoint already respects both. This hook is the single bridge: any
 * UI that wants a stable rendering order must go through here so it
 * picks up the gating + preview bypass automatically.
 *
 * Loading state returns an empty list; consumers using `.length === 0`
 * for hide-when-empty behaviour are unaffected. Once loaded, the
 * intersection of NETWORK_ORDER and the API result is returned in
 * NETWORK_ORDER's order (so visual ordering stays canonical).
 */
export function useVisibleNetworkOrder(): readonly NetworkSlug[] {
  const { networks } = useNetworks();
  return useMemo(() => {
    const visible = new Set(networks.map(n => n.slug));
    return NETWORK_ORDER.filter(slug => visible.has(slug));
  }, [networks]);
}
