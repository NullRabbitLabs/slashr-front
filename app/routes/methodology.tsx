import type { Route } from "./+types/methodology";
import { fetchNetworks } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import MethodologyPage from "@/pages/MethodologyPage";

export async function loader() {
  // Seed the per-network loss-semantics table so it server-renders.
  try {
    const res = await fetchNetworks();
    return { networks: res.data };
  } catch {
    // Degrade gracefully - the page still renders and the client refetch retries.
    return { networks: null };
  }
}

export function meta() {
  return pageMeta({
    title: "Methodology · Slashr Risk Index",
    description:
      "What goes into the Slashr Risk Index, how each input is weighted, what the score does and does not claim, and per-network loss semantics.",
    canonical: "https://slashr.dev/methodology",
  });
}

export default function MethodologyRoute({ loaderData }: Route.ComponentProps) {
  return <MethodologyPage initialNetworks={loaderData.networks} />;
}
