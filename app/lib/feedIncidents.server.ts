// The I/O half of the incident feeds. Split from feedIncidents.ts so the render
// and mapping logic stays free of aliased imports and can be unit-tested under
// `node --test` without a bundler.
//
// Fetches the PUBLIC prod API (zero secrets); for the prod flip, point UPSTREAM
// at api.slashr.dev + secrets.

import { apiBase, apiAuthHeaders } from '@/api/upstream.server';
import {
  feedWindow,
  mapEvents,
  INCIDENTS_FEED,
  type ApiEvent,
  type FeedItem,
  type FeedMeta,
} from './feedIncidents';

/// Fetch the feed window: everything in the last FEED_WINDOW_DAYS, capped at
/// FEED_MAX_ITEMS, narrowed by the variant's own query. `now` is injectable so
/// the caller can pin it in a test.
export async function fetchFeedItems(
  now: Date = new Date(),
  meta: FeedMeta = INCIDENTS_FEED,
): Promise<FeedItem[]> {
  const { from, limit } = feedWindow(now);
  const filter = meta.query ? `&${meta.query}` : '';
  const url = `${apiBase()}/v1/events?limit=${limit}&from=${encodeURIComponent(from)}${filter}`;
  const res = await fetch(url, {
    headers: { ...apiAuthHeaders(), Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`events fetch failed: ${res.status}`);
  const json = (await res.json()) as { data: ApiEvent[] };
  return mapEvents(json.data);
}
