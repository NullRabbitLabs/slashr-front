import type { Route } from "./+types/data.$month";
import { fetchRelease } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import ReleasePage from "@/pages/ReleasePage";

export async function loader({ params }: Route.LoaderArgs) {
  const month = params.month ?? "";
  try {
    const res = await fetchRelease(month);
    return { release: res.data, month };
  } catch {
    // Degrade rather than 500: a citable page that intermittently throws is
    // not citable. A malformed month lands here too and renders the notice.
    return { release: null, month };
  }
}

export function meta({ params }: Route.MetaArgs) {
  const month = params.month ?? "";
  return pageMeta({
    title: `${month} · Slashr validator penalty release`,
    description: `Validator penalties observed by Slashr in ${month}, per chain, with coverage bounds stated. CC BY 4.0.`,
    canonical: `https://slashr.dev/data/${month}`,
  });
}

export default function ReleaseRoute({ loaderData }: Route.ComponentProps) {
  return <ReleasePage release={loaderData.release} month={loaderData.month} />;
}
