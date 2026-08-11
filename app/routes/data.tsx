import type { Route } from "./+types/data";
import { fetchExportManifest } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import DataPage from "@/pages/DataPage";

export async function loader() {
  try {
    const res = await fetchExportManifest();
    return { manifest: res.data };
  } catch {
    // Degrade gracefully: the page renders an unavailable notice rather than
    // 500ing. A citable surface that is sometimes a stack trace is not citable.
    return { manifest: null };
  }
}

export function meta() {
  return pageMeta({
    title: "Data · Slashr validator penalty dataset",
    description:
      "Every validator penalty event Slashr has observed, as monthly CSV partitions. Coverage stated per chain and bounded by when monitoring began. CC BY 4.0.",
    canonical: "https://slashr.dev/data",
  });
}

export default function DataRoute({ loaderData }: Route.ComponentProps) {
  return <DataPage manifest={loaderData.manifest} />;
}
