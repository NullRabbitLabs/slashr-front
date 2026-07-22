// GET /badge/:network/:address(.svg) — embeddable per-validator shield.
// SSR (resource route, no component) so the Worker sees the embed and the NRP edge logger
// records it. Deterministic per validator; degrades to a neutral shield on 404/backend error
// so an embedded README never shows a broken image. Server-side API fetch (service JWT), same
// pattern as routes/og.tsx.
import type { Route } from "./+types/badge";
import { apiBase, apiAuthHeaders } from "@/api/upstream.server";
import { validatorBadge, notFoundBadge, unavailableBadge, type TrackRecord } from "@/lib/badge";

const KNOWN_NETWORKS = new Set([
  "solana", "ethereum", "cosmos", "sui", "polkadot", "celestia", "avalanche", "near",
]);

function svg(body: string, cache: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": cache },
  });
}

export async function loader({ params }: Route.LoaderArgs) {
  const network = params.network;
  const address = params.address.replace(/\.svg$/i, "");
  if (!KNOWN_NETWORKS.has(network) || !address) {
    return svg(notFoundBadge(), "public, max-age=300", 404);
  }
  try {
    const res = await fetch(
      `${apiBase()}/v1/validators/${encodeURIComponent(network)}/${encodeURIComponent(address)}`,
      { headers: { ...apiAuthHeaders(), Accept: "application/json" } },
    );
    if (res.status === 404) return svg(notFoundBadge(), "public, max-age=300", 404);
    if (!res.ok) return svg(unavailableBadge(), "no-store", 502);
    const json = (await res.json()) as { data: { track_record?: TrackRecord | null } };
    return svg(validatorBadge(json.data.track_record, Date.now()), "public, max-age=3600, s-maxage=3600");
  } catch {
    return svg(unavailableBadge(), "no-store", 502);
  }
}
