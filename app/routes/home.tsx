import type { Route } from "./+types/home";
import { fetchStats, fetchRiskValidators, fetchEvents } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import OverviewPage from "@/pages/OverviewPage";

export async function loader() {
  // Mirror OverviewPage's first-render fetches: stats, risk (network 'all' →
  // omitted, limit 200), and the first page of events. Each degrades to null.
  const [stats, risk, events] = await Promise.all([
    fetchStats().then((r) => r.data).catch(() => null),
    fetchRiskValidators({ limit: 200 }).then((r) => r.data).catch(() => null),
    fetchEvents({ limit: 25 })
      .then((r) => ({
        events: r.data,
        hasMore: r.pagination.has_more,
        cursor: r.pagination.next_cursor,
      }))
      .catch(() => null),
  ]);
  return { stats, risk, events };
}

export function meta() {
  return pageMeta({
    title: "Slashr · Validator Risk Index & Live Slashing Feed",
    description:
      "Track validator slashing, downtime, and commission risk across Solana, Ethereum, Sui, and Cosmos. The Slashr Risk Index scores every validator 0–100.",
    canonical: "https://slashr.dev",
  });
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return (
    <OverviewPage
      initialStats={loaderData.stats}
      initialRisk={loaderData.risk}
      initialEvents={loaderData.events}
    />
  );
}
