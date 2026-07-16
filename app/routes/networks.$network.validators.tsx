import type { Route } from "./+types/networks.$network.validators";
import { Link } from "react-router";
import { fetchNetworkValidators } from "@/api/client";
import { pageMeta } from "@/lib/pageMeta";
import { formatDate } from "@/lib/time";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const data = await fetchNetworkValidators(params.network, { limit: 100 });
    return { data };
  } catch {
    // Degrade gracefully: unknown/gated network or API hiccup.
    return { data: null };
  }
}

export function meta({ params }: Route.MetaArgs) {
  const net = params.network;
  return pageMeta({
    title: `${net} validator directory · Track record · slashr`,
    description: `Every validator we track on ${net}, clean or not. A clean validator shows no incidents recorded since we began monitoring the chain.`,
    canonical: `https://slashr.dev/networks/${net}/validators`,
  });
}

const GRID = "minmax(200px,2fr) 150px minmax(160px,1fr)";

function fmtStake(stake: number | null, token: string | null): string {
  if (stake == null) return "n/a";
  return `${Math.round(stake).toLocaleString("en-US")}${token ? ` ${token}` : ""}`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function NetworkDirectoryRoute({ loaderData, params }: Route.ComponentProps) {
  const data = loaderData.data;
  const network = params.network;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.02em", color: "var(--text)", margin: "0 0 4px" }}>
          {titleCase(network)} validator directory
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0 }}>
          Every validator we track on {network}, clean or not.
          {data?.monitoring_since && (
            <>
              {" "}A clean validator shows{" "}
              <strong style={{ color: "var(--text)" }}>
                no incidents recorded since {formatDate(data.monitoring_since)}
              </strong>
              .
            </>
          )}
        </p>
      </div>

      {!data && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
          No directory available for this network.
        </div>
      )}

      {data && (
        <div className="rd-table-scroll">
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow)", overflow: "hidden", minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 16, padding: "14px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>
              <span>Validator</span>
              <span style={{ textAlign: "right" }}>Total staked</span>
              <span style={{ textAlign: "right" }}>Track record</span>
            </div>

            {data.validators.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                No validators registered yet.
              </div>
            )}

            {data.validators.map((v) => {
              const badge = v.clean
                ? { text: "No incidents recorded", color: "var(--ok)", bg: "var(--ok-soft)" }
                : { text: `${v.incident_count} incident${v.incident_count !== 1 ? "s" : ""}`, color: "var(--crit)", bg: "var(--crit-soft)" };
              return (
                <Link
                  key={v.address}
                  to={`/validator/${network}/${encodeURIComponent(v.address)}`}
                  className="risk-row"
                  style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", gap: 16, padding: "16px 22px", borderBottom: "1px solid var(--border)", boxShadow: `inset 3px 0 0 ${v.clean ? "var(--ok)" : "var(--crit)"}`, textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.moniker || v.address}
                    </div>
                    <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.address}
                    </div>
                  </div>
                  <span style={{ textAlign: "right", fontSize: 13.5, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                    {fmtStake(v.stake, v.stake_token)}
                  </span>
                  <span style={{ justifySelf: "end", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: badge.color, background: badge.bg }}>
                    {v.clean && <span aria-hidden="true">&#10003;</span>}
                    {badge.text}
                  </span>
                </Link>
              );
            })}
          </div>
          {data.pagination.has_more && (
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12, textAlign: "center" }}>
              Showing the first {data.validators.length} by stake. More are available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
