import type { Route } from "./+types/reports.detail";
import { fetchReport } from "@/api/client";
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
  return [
    { title: `${name} Reliability Report · slashr` },
    {
      name: "description",
      content: `Cross-chain validator reliability summary for ${name} on slashr.`,
    },
    {
      tagName: "link",
      rel: "canonical",
      href: `https://slashr.dev/reports/${params.providerSlug}`,
    },
  ];
}

export default function ReportDetailRoute({ loaderData }: Route.ComponentProps) {
  return <ReportDetailPage initialReport={loaderData.report} />;
}
