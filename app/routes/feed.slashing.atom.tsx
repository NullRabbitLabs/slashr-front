// GET /feed/slashing.atom - Atom 1.0, real penalties only.
import { SLASHING_FEED } from "@/lib/feedIncidents";
import { atomResponse } from "@/lib/feedResponses.server";

export const loader = () => atomResponse(SLASHING_FEED, "slashing.atom");
