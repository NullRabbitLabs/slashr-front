// GET /feed/incidents.json - JSON Feed 1.1, the full incident firehose.
import { INCIDENTS_FEED } from "@/lib/feedIncidents";
import { jsonFeedResponse } from "@/lib/feedResponses.server";

export const loader = () => jsonFeedResponse(INCIDENTS_FEED, "incidents.json");
