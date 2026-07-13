import { RequireAuth } from "@/components/RequireAuth";
import AlertsPage from "@/pages/AlertsPage";

// Creating an alert requires login; the guard runs client-side (session cookie).
export default function AlertsRoute() {
  return (
    <RequireAuth>
      <AlertsPage />
    </RequireAuth>
  );
}
