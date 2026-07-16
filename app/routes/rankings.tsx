import { redirect } from "react-router";

// The severity-count leaderboard and the Slashr Risk Index were two ranking
// surfaces answering the same question with different maths. We keep one — the
// Risk Index (/risk) — and 301 the legacy path into it. Query params (network,
// period) are dropped; /risk has its own network filter.
export function loader() {
  return redirect("/risk", 301);
}
