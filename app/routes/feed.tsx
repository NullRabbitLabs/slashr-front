import type { Route } from "./+types/feed";
import { fetchEvents } from "@/api/client";
import FeedPage from "@/pages/FeedPage";

export async function loader() {
  try {
    const res = await fetchEvents({ limit: 25 });
    return {
      events: res.data,
      hasMore: res.pagination.has_more,
      cursor: res.pagination.next_cursor,
    };
  } catch {
    return { events: [], hasMore: false, cursor: null };
  }
}

export function meta() {
  return [
    { title: "Live Validator Incident Feed — Slashing & Downtime · slashr" },
    {
      name: "description",
      content:
        "Every validator slashing, downtime, and commission event across Solana, Ethereum, Sui, and Cosmos, as it happens.",
    },
    { tagName: "link", rel: "canonical", href: "https://slashr.dev/feed" },
  ];
}

export default function FeedRoute({ loaderData }: Route.ComponentProps) {
  return <FeedPage initialData={loaderData} />;
}
