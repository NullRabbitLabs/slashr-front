// GET /feed/stories.json - one item per confirmed incident episode (WS-C).
import { STORIES_FEED } from "@/lib/feedStories";
import { jsonFeedResponse } from "@/lib/feedResponses.server";

export const loader = () => jsonFeedResponse(STORIES_FEED, "stories.json");
