import type { Route } from "./+types/incident.$slug";
import { fetchIncident } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import IncidentPage from "@/pages/IncidentPage";

// Server-rendered: this is the URL in every breaking tweet, so it has to be
// readable the instant it is opened (and by the link unfurler), not after a
// client-side fetch.
export async function loader({ params }: Route.LoaderArgs) {
  try {
    const res = await fetchIncident(params.slug);
    return { incident: res.data };
  } catch {
    throw new Response("Incident not found", { status: 404 });
  }
}

const KIND_LABELS: Record<string, string> = {
  mass_down_burst: "correlated outage",
  slash_burst: "slashing cascade",
  mass_outage: "correlated outage",
  exit_wave: "exit wave",
  commission_cluster: "coordinated commission move",
  whale_down: "large validator offline",
  real_slash: "slashing",
  volume_anomaly: "unusual activity",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ongoing",
  resolved: "Resolved",
  retracted: "Unconfirmed",
};

export function meta({ loaderData, params }: Route.MetaArgs) {
  const inc = loaderData?.incident;
  const chain = inc?.chain ? inc.chain.charAt(0).toUpperCase() + inc.chain.slice(1) : "Validator";
  const kind = KIND_LABELS[inc?.kind ?? ""] ?? "incident";
  const status = STATUS_LABELS[inc?.status ?? ""] ?? "Tracking";
  return pageMeta({
    title: `${chain} ${kind} · ${status} · slashr`,
    description: inc
      ? `${chain} ${kind} tracked by slashr. Peak ${inc.peak_magnitude} validators affected. Current status: ${status}.`
      : `Validator incident tracked by slashr.`,
    canonical: `https://slashr.dev/incident/${params.slug}`,
  });
}

export default function IncidentRoute({ loaderData }: Route.ComponentProps) {
  return <IncidentPage incident={loaderData.incident} />;
}
