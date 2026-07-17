import { RequireAuth } from "@/components/RequireAuth";
import AlertsPage from "@/pages/AlertsPage";
import { pageMeta } from "@/lib/pageMeta";

export function meta() {
  return pageMeta({
    title: "Get alerts · slashr",
    description: "Subscribe to email alerts for validator incidents across every network we track.",
    canonical: "https://slashr.dev/alerts",
  });
}

// Creating an alert requires login; the guard runs client-side (session cookie).
export default function AlertsRoute() {
  return (
    <RequireAuth>
      <AlertsPage />
    </RequireAuth>
  );
}
