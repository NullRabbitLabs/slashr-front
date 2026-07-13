import type { Route } from "./+types/reports.providers";
import { fetchReportProviders } from "@/api/client";
import ReportsPage from "@/pages/ReportsPage";

export async function loader() {
  try {
    const res = await fetchReportProviders({ page: 1, per_page: 25 });
    return { providers: res };
  } catch {
    return { providers: null };
  }
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Reliability Reports · slashr" },
    {
      name: "description",
      content: "Monthly validator reliability reports by staking provider.",
    },
    {
      tagName: "link",
      rel: "canonical",
      href: "https://slashr.dev/reports/providers",
    },
  ];
}

export default function ReportsProvidersRoute({ loaderData }: Route.ComponentProps) {
  return <ReportsPage initialProviders={loaderData.providers} />;
}
