// The I/O half of the story feed. Split from feedStories.ts for the same
// reason as the incident feeds: the mapping stays testable without a bundler.

import { apiBase, apiAuthHeaders } from '@/api/upstream.server';
import { mapIncidents, type ApiIncident } from './feedStories';
import type { FeedItem } from './feedIncidents';

export async function fetchStoryItems(): Promise<FeedItem[]> {
  const res = await fetch(`${apiBase()}/v1/incidents`, {
    headers: { ...apiAuthHeaders(), Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`incidents fetch failed: ${res.status}`);
  const json = (await res.json()) as { data: ApiIncident[] };
  return mapIncidents(json.data);
}
