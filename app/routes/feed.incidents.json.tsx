// GET /feed/incidents.json - JSON Feed 1.1 of recent validator incidents.
// Ported from the Pages Function functions/feed/incidents.json.ts.
import { fetchFeedItems, renderJsonFeed } from "@/lib/feedIncidents";

export async function loader() {
  let items;
  try {
    items = await fetchFeedItems(50);
  } catch (err) {
    console.error("incidents.json: fetch failed:", String(err));
    items = [];
  }
  const feed = renderJsonFeed(items);
  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
