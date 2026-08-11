// GET /feed/slashing.json - JSON Feed 1.1, real penalties only.
import { SLASHING_FEED } from "@/lib/feedIncidents";
import { jsonFeedResponse } from "@/lib/feedResponses.server";

export const loader = () => jsonFeedResponse(SLASHING_FEED, "slashing.json");
