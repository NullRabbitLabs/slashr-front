import { pageMeta } from "@/lib/pageMeta";

export { default } from "@/pages/DevelopersPage";

export function meta() {
  return pageMeta({
    title: "Developers · Slashr",
    description:
      "Integrate validator incident data into your AI agent via MCP. Query delinquency, slashing, infrastructure scans, and delegation health across every network we track.",
    canonical: "https://slashr.dev/developers",
  });
}
