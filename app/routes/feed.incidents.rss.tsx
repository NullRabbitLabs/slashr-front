// GET /feed/incidents.rss — RSS 2.0 feed of recent validator incidents.
// Ported from the Pages Function functions/feed/incidents.rss.ts.
import { fetchFeedItems, renderRss } from "@/lib/feedIncidents";

export async function loader() {
  let items;
  try {
    items = await fetchFeedItems(50);
  } catch (err) {
    console.error("incidents.rss: fetch failed:", String(err));
    items = [];
  }
  const xml = renderRss(items, new Date().toUTCString());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
