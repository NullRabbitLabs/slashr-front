// GET /badge/monitored.svg — generic id-less shield [ slashr | monitored ], for listings /
// aggregators (DefiLlama, L2Beat) that just want to show they're watched. Links to slashr.dev.
// SSR so the embed is logged. Deterministic, self-contained, long-cached.
import { genericBadge } from "@/lib/badge";

export async function loader() {
  return new Response(genericBadge(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
