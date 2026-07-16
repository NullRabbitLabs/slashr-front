import { redirect } from "react-router";

// Bare /networks has no index page; send it to the validator directory.
export function loader() {
  return redirect("/validators");
}
