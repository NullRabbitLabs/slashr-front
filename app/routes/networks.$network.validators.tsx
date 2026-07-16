import type { Route } from "./+types/networks.$network.validators";
import { fetchNetworks, fetchNetworkValidators } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import DirectoryPage from "@/pages/DirectoryPage";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const [data, nets] = await Promise.all([
      fetchNetworkValidators(params.network, { limit: 100 }),
      fetchNetworks(),
    ]);
    return { network: params.network, data, networks: nets.data };
  } catch {
    // Degrade gracefully: unknown/gated network or API hiccup.
    return { network: params.network, data: null, networks: [] };
  }
}

export function meta({ params }: Route.MetaArgs) {
  const net = params.network;
  return pageMeta({
    title: `${net} validator directory · Track record · slashr`,
    description: `Every validator we track on ${net}, clean or not. A clean validator shows no incidents recorded since we began monitoring the chain.`,
    canonical: `https://slashr.dev/networks/${net}/validators`,
  });
}

export default function NetworkDirectoryRoute({ loaderData }: Route.ComponentProps) {
  return (
    <DirectoryPage
      network={loaderData.network}
      data={loaderData.data}
      networks={loaderData.networks}
    />
  );
}
