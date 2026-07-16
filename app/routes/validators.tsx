import { redirect } from "react-router";
import { fetchNetworks } from "@/api/client";

// `/validators` used to render the directory for the first public network —
// byte-identical to `/networks/<that-network>/validators`, with a competing
// self-canonical. There's one directory surface: the per-network page. So
// `/validators` now 302s to the primary network's directory (pills switch
// networks from there). No standalone body, no competing canonical.
export async function loader() {
  let primary = "solana";
  try {
    const nets = await fetchNetworks();
    primary = nets.data[0]?.slug ?? "solana";
  } catch {
    // Fall back to solana if /v1/networks is unreachable.
  }
  return redirect(`/networks/${primary}/validators`);
}
