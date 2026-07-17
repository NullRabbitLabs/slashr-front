import { redirect } from "react-router";
import { fetchNetworks } from "@/api/client";

// Bare /networks has no index page. Send it straight to the primary network's
// directory in a single hop (it used to bounce through /validators, which then
// redirected again). Prefer Solana when public, else the first public network -
// same rule as /validators, so both aliases land in the same place.
export async function loader() {
  let primary = "solana";
  try {
    const nets = await fetchNetworks();
    const slugs = nets.data.map(n => n.slug);
    primary = slugs.includes("solana") ? "solana" : (slugs[0] ?? "solana");
  } catch {
    // Fall back to solana if /v1/networks is unreachable.
  }
  return redirect(`/networks/${primary}/validators`);
}
