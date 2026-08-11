// GET /feed/stories.rss - one item per confirmed incident episode (WS-C).
import { STORIES_FEED } from "@/lib/feedStories";
import { rssResponse } from "@/lib/feedResponses.server";

export const loader = () => rssResponse(STORIES_FEED, "stories.rss");
