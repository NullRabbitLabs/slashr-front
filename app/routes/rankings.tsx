import type { Route } from "./+types/rankings";
import { fetchLeaderboard } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import LeaderboardPage, { resolveNetworkParam, isPeriod } from "@/pages/LeaderboardPage";

export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  // Mirror the page's first-render defaults/resolution so the seed lines up:
  // network default 'solana' (+ ticker aliases), period default '30d',
  // sort default 'worst', per_page 25 (PER_PAGE in useLeaderboard).
  const network = resolveNetworkParam(params.get("network") ?? "solana");
  const rawPeriod = params.get("period") ?? "30d";
  const period = isPeriod(rawPeriod) ? rawPeriod : "30d";

  try {
    const res = await fetchLeaderboard({
      network,
      period,
      sort: "worst",
      page: 1,
      per_page: 25,
    });
    return { leaderboard: res.data };
  } catch {
    return { leaderboard: null };
  }
}

export function meta() {
  return pageMeta({
    title: "Validator Rankings · slashr",
    description:
      "Worst offenders and most reliable validators across every network we track.",
    canonical: "https://slashr.dev/rankings",
  });
}

export default function RankingsRoute({ loaderData }: Route.ComponentProps) {
  return <LeaderboardPage initialLeaderboard={loaderData.leaderboard} />;
}
