import type { Route } from "./+types/validators";
import { fetchNetworks, fetchNetworkValidators } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import DirectoryPage from "@/pages/DirectoryPage";

export async function loader() {
  // The directory is per-network; /validators defaults to the first public
  // network and its pills link to the others. Risk-ranked data lives at /risk.
  try {
    const nets = await fetchNetworks();
    const primary = nets.data[0]?.slug ?? "solana";
    const data = await fetchNetworkValidators(primary, { limit: 100 });
    return { network: primary as string, data, networks: nets.data };
  } catch {
    // Degrade gracefully - the page still renders and refetches client-side.
    return { network: "solana", data: null, networks: [] };
  }
}

export function meta() {
  return pageMeta({
    title: "Validator directory · Track record · slashr",
    description:
      "Every validator we track across Solana, Sui, Cosmos and beyond, with total stake and an honest track record. A clean validator shows no incidents recorded since we began monitoring the chain.",
    canonical: "https://slashr.dev/validators",
  });
}

export default function ValidatorsRoute({ loaderData }: Route.ComponentProps) {
  return (
    <DirectoryPage
      network={loaderData.network}
      data={loaderData.data}
      networks={loaderData.networks}
    />
  );
}
