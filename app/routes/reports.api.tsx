import { pageMeta } from "@/lib/pageMeta";

// The Reports & API data-product page. The primary /reports route now shows the
// actual reliability-report list; this is the marketing/API surface.
export { default } from "@/pages/ReportsApiPage";

export function meta() {
  return pageMeta({
    title: "Reports & API · slashr",
    description:
      "Pull validator risk scores and incident data into your own monitoring and treasury systems.",
    canonical: "https://slashr.dev/reports/api",
  });
}
