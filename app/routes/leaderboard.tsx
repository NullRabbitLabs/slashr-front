import { redirect } from "react-router";

// Legacy path — server-side 302 to the canonical /rankings.
export function loader() {
  return redirect("/rankings");
}
