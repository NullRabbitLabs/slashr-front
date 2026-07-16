import { redirect } from "react-router";

// Legacy path - 301 straight to the canonical ranking surface, the Risk Index.
export function loader() {
  return redirect("/risk", 301);
}
