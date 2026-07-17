import { pageMeta } from "@/lib/pageMeta";

export { default } from "@/pages/CheckPage";

export function meta() {
  return pageMeta({
    title: "Check a wallet · slashr",
    description:
      "Paste your wallet address to see your validators' grades, incident history, and what their downtime costs you.",
    canonical: "https://slashr.dev/check",
  });
}
