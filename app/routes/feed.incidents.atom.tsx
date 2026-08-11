// GET /feed/incidents.atom - Atom 1.0, the full incident firehose.
import { INCIDENTS_FEED } from "@/lib/feedIncidents";
import { atomResponse } from "@/lib/feedResponses.server";

export const loader = () => atomResponse(INCIDENTS_FEED, "incidents.atom");
