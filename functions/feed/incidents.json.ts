// GET /feed/incidents.json — JSON Feed 1.1 of recent validator incidents.
// Same data as incidents.rss, for tools/agents that prefer JSON.
import { fetchFeedItems, renderJsonFeed, type Env } from './_incidents';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  let items;
  try {
    items = await fetchFeedItems(env, 50);
  } catch (err) {
    console.error('incidents.json: fetch failed:', String(err));
    items = [];
  }

  const feed = renderJsonFeed(items);

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
};
