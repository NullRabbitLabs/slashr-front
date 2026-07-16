// @ts-nocheck - cf-wasm types use workerd bindings; satori virtual DOM ≠ React.ReactNode
// GET /og/:network/:address(.png) - dynamic 1200x630 OG image per validator.
// Ported from the Pages Function functions/og/[network]/[address].ts.
// Fetches the PUBLIC prod API (zero secrets).
// Force the workerd variant: it imports the .wasm as a static module (allowed
// in workerd) instead of runtime-compiling bytes (disallowed → CompileError).
import satori from "@cf-wasm/satori/workerd";
import { Resvg } from "@cf-wasm/resvg/workerd";
import type { Route } from "./+types/og";
import { apiBase, apiAuthHeaders } from "@/api/upstream.server";

const NETWORK_META: Record<string, { ticker: string; color: string; name: string }> = {
  solana: { ticker: "SOL", color: "#14F195", name: "Solana" },
  ethereum: { ticker: "ETH", color: "#849DFF", name: "Ethereum" },
  cosmos: { ticker: "ATOM", color: "#A5A7C4", name: "Cosmos Hub" },
  sui: { ticker: "SUI", color: "#4DA2FF", name: "Sui" },
  polkadot: { ticker: "DOT", color: "#E6007A", name: "Polkadot" },
  celestia: { ticker: "TIA", color: "#7B2BF9", name: "Celestia" },
  avalanche: { ticker: "AVAX", color: "#E84142", name: "Avalanche" },
  near: { ticker: "NEAR", color: "#00C08B", name: "Near" },
};

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return addr.slice(0, 8) + "..." + addr.slice(-4);
}

function formatStake(rawStake: number | string | null, token: string | null): string {
  if (rawStake == null || token == null) return "";
  const stake = typeof rawStake === "string" ? parseFloat(rawStake) : rawStake;
  if (isNaN(stake)) return "";
  if (stake >= 1_000_000) return `${(stake / 1_000_000).toFixed(1)}M ${token}`;
  if (stake >= 1_000) return `${(stake / 1_000).toFixed(0)}K ${token}`;
  return `${stake.toFixed(0)} ${token}`;
}

function formatUsd(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  if (amount >= 1) return `$${amount.toFixed(0)}`;
  return "$0";
}

export async function loader({ request, params }: Route.LoaderArgs) {
  try {
    const network = params.network;
    const address = params.address.replace(/\.png$/, "");

    const meta = NETWORK_META[network];
    if (!meta) return new Response("Unknown network", { status: 404 });

    let moniker = "";
    let eventCount = 0;
    let stake: number | null = null;
    let stakeToken: string | null = null;
    let totalLossUsd = 0;
    let costPerHourUsd: number | null = null;

    try {
      const res = await fetch(
        `${apiBase()}/v1/validators/${encodeURIComponent(network)}/${encodeURIComponent(address)}`,
        { headers: { ...apiAuthHeaders(), Accept: "application/json" } },
      );
      if (res.ok) {
        const json = (await res.json()) as {
          data: {
            moniker: string | null;
            events: { id: number; loss_per_hour_usd: number | null; estimated_loss_usd: number | null }[];
            stake: number | null;
            stake_token: string | null;
          };
        };
        moniker = json.data.moniker?.trim() || "";
        eventCount = json.data.events.length;
        stake = json.data.stake;
        stakeToken = json.data.stake_token;
        for (const e of json.data.events) {
          if (e.estimated_loss_usd) totalLossUsd += e.estimated_loss_usd;
          if (e.loss_per_hour_usd && (costPerHourUsd === null || e.loss_per_hour_usd > costPerHourUsd)) {
            costPerHourUsd = e.loss_per_hour_usd;
          }
        }
      }
    } catch {
      // continue with defaults
    }

    const displayName = moniker || truncateAddress(address);
    const stakeStr = formatStake(stake, stakeToken);
    const lossStr = totalLossUsd > 0 ? `${formatUsd(totalLossUsd)} estimated losses` : "";
    const costStr = costPerHourUsd != null && costPerHourUsd > 1 ? `~${formatUsd(costPerHourUsd)}/hr when down` : "";

    const statChips: { text: string; color: string }[] = [];
    if (eventCount > 0) {
      statChips.push({ text: `${eventCount} incident${eventCount === 1 ? "" : "s"}`, color: "#FF4545" });
    } else {
      statChips.push({ text: "No incidents", color: "#14f195" });
    }
    if (stakeStr) statChips.push({ text: `${stakeStr} at stake`, color: "rgba(255,255,255,0.5)" });
    if (lossStr) statChips.push({ text: lossStr, color: "#FF4545" });
    if (costStr) statChips.push({ text: costStr, color: "rgba(255,255,255,0.4)" });

    // satori's workerd build needs uncompressed TTF/OTF. The Worker can't
    // reliably self-fetch its own /fonts/* assets in prod (the self-subrequest
    // hits the SSR handler, not the assets binding → satori gets HTML), so pull
    // the TTF from gstatic (Google's CDN) directly.
    const [spaceGrotesk, jetbrainsMono, inter] = await Promise.all([
      fetch("https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksjNsdjTQ.ttf").then((r) => r.arrayBuffer()),
      fetch("https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPVmSsac.ttf").then((r) => r.arrayBuffer()),
      fetch("https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZhrj72A.ttf").then((r) => r.arrayBuffer()),
    ]);

    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#0a0a0b",
            padding: "52px 64px",
          },
          children: [
            {
              type: "div",
              props: {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "auto" },
                children: [
                  {
                    type: "div",
                    props: {
                      style: { fontSize: 20, fontFamily: "JetBrains Mono", color: "#14f195", letterSpacing: "-0.02em" },
                      children: "slashr.dev",
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", alignItems: "center", gap: 10 },
                      children: [
                        { type: "div", props: { style: { width: 12, height: 12, borderRadius: "50%", backgroundColor: meta.color } } },
                        {
                          type: "div",
                          props: {
                            style: { fontSize: 18, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em" },
                            children: meta.ticker,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: "auto" },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: moniker ? 56 : 38,
                        fontFamily: moniker ? "Space Grotesk" : "JetBrains Mono",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.92)",
                        letterSpacing: moniker ? "-0.03em" : "0",
                        lineHeight: 1.1,
                      },
                      children: displayName,
                    },
                  },
                  ...(moniker
                    ? [
                        {
                          type: "div",
                          props: {
                            style: { fontSize: 15, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.25)", marginTop: 4 },
                            children: truncateAddress(address),
                          },
                        },
                      ]
                    : []),
                ],
              },
            },
            {
              type: "div",
              props: {
                style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 20 },
                children: statChips.map((chip, i) => ({
                  type: "div",
                  props: {
                    key: i,
                    style: { display: "flex", alignItems: "center", gap: 20 },
                    children: [
                      ...(i > 0
                        ? [{ type: "div", props: { style: { fontSize: 18, color: "rgba(255,255,255,0.15)", fontFamily: "Inter" }, children: "|" } }]
                        : []),
                      { type: "div", props: { style: { fontSize: 18, fontFamily: "JetBrains Mono", color: chip.color }, children: chip.text } },
                    ],
                  },
                })),
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "Space Grotesk", data: spaceGrotesk, weight: 700, style: "normal" },
          { name: "JetBrains Mono", data: jetbrainsMono, weight: 600, style: "normal" },
          { name: "Inter", data: inter, weight: 500, style: "normal" },
        ],
      },
    );

    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const png = resvg.render().asPng();

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
