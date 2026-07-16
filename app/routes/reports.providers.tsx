import { redirect } from "react-router";

// Consolidated: the provider list is now the primary /reports page.
export function loader() {
  return redirect("/reports");
}
