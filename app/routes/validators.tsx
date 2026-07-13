import type { Route } from "./+types/validators";
import { fetchRiskValidators } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import ValidatorsPage from "@/pages/ValidatorsPage";

export async function loader() {
  // Mirror the page's first-render fetch: default network 'all' → omitted
  // (useRiskValidators normalises 'all' to undefined), default limit 200.
  try {
    const res = await fetchRiskValidators({ limit: 200 });
    return { risk: res.data };
  } catch {
    // Degrade gracefully — the page still renders and the client refetch retries.
    return { risk: null };
  }
}

export function meta() {
  return pageMeta({
    title: "Validator Directory — Stake, Uptime & Risk · slashr",
    description:
      "Every validator we track across Solana, Ethereum, Sui, and Cosmos, with total stake, 30-day uptime, and live risk status. Click any validator for its full risk profile.",
    canonical: "https://slashr.dev/validators",
  });
}

export default function ValidatorsRoute({ loaderData }: Route.ComponentProps) {
  return <ValidatorsPage initialRisk={loaderData.risk} />;
}
