import type { Route } from "./+types/risk";
import { fetchRiskValidators } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import RiskPage from "@/pages/RiskPage";

export async function loader() {
  // Mirror the page's first-render fetch: default network 'all' → omitted
  // (useRiskValidators normalises 'all' to undefined), default limit 200.
  try {
    const res = await fetchRiskValidators({ limit: 200 });
    return { risk: res.data };
  } catch {
    // Degrade gracefully - the page still renders and the client refetch retries.
    return { risk: null };
  }
}

export function meta() {
  return pageMeta({
    title: "Slashr Risk Index · Validator Risk Scores (0–100)",
    description:
      "An independent 0–100 risk score for every validator we track across Solana, Ethereum, Sui, and Cosmos, a transparent composite of downtime, slashing history, commission, and infrastructure health.",
    canonical: "https://slashr.dev/risk",
  });
}

export default function RiskRoute({ loaderData }: Route.ComponentProps) {
  return <RiskPage initialRisk={loaderData.risk} />;
}
