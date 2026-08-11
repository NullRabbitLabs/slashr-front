// GET /feed/incidents.rss - RSS 2.0, the full incident firehose.
import { INCIDENTS_FEED } from "@/lib/feedIncidents";
import { rssResponse } from "@/lib/feedResponses.server";

export const loader = () => rssResponse(INCIDENTS_FEED, "incidents.rss");
