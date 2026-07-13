import type { Route } from "./+types/reports.detail";
import { fetchReport } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import ReportDetailPage from "@/pages/ReportDetailPage";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const res = await fetchReport(params.providerSlug);
    return { report: res.data };
  } catch {
    throw new Response("Report not found", { status: 404 });
  }
}

export function meta({ loaderData, params }: Route.MetaArgs) {
  const name = loaderData?.report?.provider_name?.trim() || params.providerSlug;
  return pageMeta({
    title: `${name} Reliability Report · slashr`,
    description: `Cross-chain validator reliability summary for ${name} on slashr.`,
    canonical: `https://slashr.dev/reports/${params.providerSlug}`,
  });
}

export default function ReportDetailRoute({ loaderData }: Route.ComponentProps) {
  return <ReportDetailPage initialReport={loaderData.report} />;
}
