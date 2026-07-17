import { redirect } from "react-router";
import { fetchNetworks } from "@/api/client";

// `/validators` used to render the directory for the first public network —
// byte-identical to `/networks/<that-network>/validators`, with a competing
// self-canonical. There's one directory surface: the per-network page. So
// `/validators` now 302s to the primary network's directory (pills switch
// networks from there). No standalone body, no competing canonical.
export async function loader() {
  // Land on the flagship network, not whatever /v1/networks happens to return
  // first (that was Avalanche — an arbitrary default the old page shipped and
  // the brief called out). Prefer Solana when it's public, else the first
  // public network.
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
