// GET /feed/stories.atom - one item per confirmed incident episode (WS-C).
import { STORIES_FEED } from "@/lib/feedStories";
import { atomResponse } from "@/lib/feedResponses.server";

export const loader = () => atomResponse(STORIES_FEED, "stories.atom");
