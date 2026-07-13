import type { Route } from "./+types/insights";
import { fetchInsights } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import InsightsPage from "@/pages/InsightsPage";

export async function loader() {
  try {
    const res = await fetchInsights();
    return { insights: res.data };
  } catch {
    return { insights: null };
  }
}

export function meta() {
  return pageMeta({
    title: "Insights · slashr",
    description:
      "Heatmaps, loss charts, and network breakdowns for validator penalties.",
    canonical: "https://slashr.dev/insights",
  });
}

export default function InsightsRoute({ loaderData }: Route.ComponentProps) {
  return <InsightsPage initialInsights={loaderData.insights} />;
}
