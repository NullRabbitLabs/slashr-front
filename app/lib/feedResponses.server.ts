// One place that turns a feed variant into an HTTP response, so every feed
// route is three lines and none of them can drift on caching, content type or
// error behaviour.
//
// A feed that 500s is worse than a feed that is briefly empty: readers
// unsubscribe from broken feeds and rarely come back. So an upstream failure
// degrades to an empty document with the right content type, and is logged.

import {
  renderRss,
  renderAtom,
  renderJsonFeed,
  type FeedItem,
  type FeedMeta,
} from './feedIncidents';
import { fetchFeedItems } from './feedIncidents.server';

const CACHE = 'public, max-age=300, s-maxage=300';

async function itemsOrEmpty(meta: FeedMeta, label: string): Promise<FeedItem[]> {
  try {
    return await fetchFeedItems(new Date(), meta);
  } catch (err) {
    console.error(`${label}: fetch failed:`, String(err));
    return [];
  }
}

export async function rssResponse(meta: FeedMeta, label: string): Promise<Response> {
  const items = await itemsOrEmpty(meta, label);
  return new Response(renderRss(items, new Date().toUTCString(), meta), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': CACHE,
    },
  });
}

export async function atomResponse(meta: FeedMeta, label: string): Promise<Response> {
  const items = await itemsOrEmpty(meta, label);
  return new Response(renderAtom(items, new Date().toISOString(), meta), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': CACHE,
    },
  });
}

export async function jsonFeedResponse(meta: FeedMeta, label: string): Promise<Response> {
  const items = await itemsOrEmpty(meta, label);
  return new Response(JSON.stringify(renderJsonFeed(items, meta), null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': CACHE,
    },
  });
}
