// GET /feed/slashing.rss - RSS 2.0, real penalties only. The curated feed.
import { SLASHING_FEED } from "@/lib/feedIncidents";
import { rssResponse } from "@/lib/feedResponses.server";

export const loader = () => rssResponse(SLASHING_FEED, "slashing.rss");
