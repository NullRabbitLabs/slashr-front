// GET /feed/incidents.rss — RSS 2.0 feed of recent validator incidents.
// Fetches events via the edge proxy (service token stays server-side, so the
// API keeps its Bearer floor). Falls back to an empty channel on API failure.
import { fetchFeedItems, renderRss, type Env } from './_incidents';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  let items;
  try {
    items = await fetchFeedItems(env, 50);
  } catch (err) {
    console.error('incidents.rss: fetch failed:', String(err));
    items = [];
  }

  const xml = renderRss(items, new Date().toUTCString());

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
};
