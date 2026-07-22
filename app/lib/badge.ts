// Slashr embeddable SVG shields, served under /badge/ for validator READMEs / listings.
// Ported from the "Slashr Badge" design brief (Simon, 2026-07-22): self-contained + byte-stable —
// same validator in -> identical SVG out, no web fonts / images / network refs (~1KB). Served by
// the SSR routes (app/routes/badge.*.tsx) so the Worker sees the embed and the NRP edge logger
// records it.
//
// Two swap-points stay isolated:
//  1. shieldSvg() — the look (from the brief).
//  2. badgeState() — the status SOURCE. v1 = FACT-based track record (clean / incident / monitored),
//     deliberately NOT the calibration-gated Risk Index (CLAUDE.md rule 7). `slashed` is defined but
//     off by default (track_record doesn't distinguish a slash from downtime).

/** The subset of the validator API's `track_record` the badge reads. */
export interface TrackRecord {
  monitoring_since: string | null;
  clean: boolean;
  last_incident_at: string | null;
}

export type BadgeStatus = "clean" | "incident" | "monitored" | "slashed";

const STATUS: Record<BadgeStatus, { fill: string; label: string }> = {
  clean: { fill: "#2ea043", label: "clean" }, // green
  incident: { fill: "#c9911f", label: "incident" }, // amber
  slashed: { fill: "#d13d3d", label: "slashed" }, // red — optional escalation, off by default
  monitored: { fill: "#4b5563", label: "monitored" }, // neutral — fail-safe + generic mark
};

export interface BadgeState {
  status: BadgeStatus;
  value: string;
}

const daysSince = (nowMs: number, iso: string): number =>
  Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 86_400_000));

/**
 * SWAP-POINT #2 — derive {status, value} from the validator's live track record.
 * Neutral "monitored" whenever the clean anchor is withheld. A recorded incident reads as amber
 * "incident"; the red "slashed" escalation is off by default (track_record can't tell a slash from
 * downtime). `nowMs` is passed in for determinism / testing.
 */
export function badgeState(tr: TrackRecord | null | undefined, nowMs: number): BadgeState {
  if (!tr || tr.monitoring_since == null) return { status: "monitored", value: "monitored" };
  if (tr.last_incident_at == null) {
    return { status: "clean", value: "clean · " + daysSince(nowMs, tr.monitoring_since) + "d" };
  }
  return { status: "incident", value: "incident " + daysSince(nowMs, tr.last_incident_at) + "d ago" };
}

// Deterministic text widths — approximate Verdana@11, no DOM measuring, so the file is byte-stable.
const CW: Record<string, number> = { m: 9.5, w: 9.5, i: 3.3, l: 3.3, ".": 3.3, "·": 4, " ": 4 };
const measure = (s: string): number => [...s].reduce((n, c) => n + (CW[c] ?? 6.6), 0);
const esc = (s: string): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * SWAP-POINT #1 — the shield look (from the brief). Left cell: the slashr mark (inline vector,
 * nothing fetched) + wordmark on a #1f2937 field; right cell: the status value, tinted. A safe
 * system font stack and deterministic widths keep it byte-stable and crisp at any zoom.
 */
export function shieldSvg(value: string, status: BadgeStatus): string {
  const s = STATUS[status] ?? STATUS.monitored;
  const t = esc(value || s.label);
  const lw = +(24 + measure("slashr") + 6).toFixed(1);
  const rw = +(measure(value || s.label) + 14).toFixed(1);
  const w = Math.round(lw + rw);
  const mx = +(lw + rw / 2).toFixed(1);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="slashr: ${t}">` +
    `<title>slashr: ${t}</title>` +
    `<linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-opacity=".12"/></linearGradient>` +
    `<clipPath id="r"><rect width="${w}" height="20" rx="3"/></clipPath>` +
    `<g clip-path="url(#r)">` +
    `<rect width="${lw}" height="20" fill="#1f2937"/>` +
    `<rect x="${lw}" width="${rw}" height="20" fill="${s.fill}"/>` +
    `<rect width="${w}" height="20" fill="url(#a)"/>` +
    `</g>` +
    `<g transform="translate(5 3)"><rect width="14" height="14" rx="3.5" fill="#3b82f6"/><path d="M8 2 4 8h2.6L5.7 12 10 5.6H7z" fill="#fff"/></g>` +
    `<g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">` +
    `<text x="24" y="15" fill="#000" fill-opacity=".25">slashr</text><text x="24" y="14">slashr</text>` +
    `<text x="${mx}" y="15" text-anchor="middle" fill="#000" fill-opacity=".25">${t}</text>` +
    `<text x="${mx}" y="14" text-anchor="middle">${t}</text>` +
    `</g></svg>`
  );
}

/** Per-validator badge: [ slashr | <track-record status> ]. */
export function validatorBadge(tr: TrackRecord | null | undefined, nowMs: number): string {
  const st = badgeState(tr, nowMs);
  return shieldSvg(st.value, st.status);
}

/** Generic id-less badge: [ slashr | monitored ] for listings / aggregators. */
export function genericBadge(): string {
  return shieldSvg("monitored", "monitored");
}

/** Degrade shields — never a broken README image. A validator Slashr doesn't track shows a neutral
 *  "not found" (never a false "monitored"); a transient backend error uses the "monitored" fail-safe. */
export function notFoundBadge(): string {
  return shieldSvg("not found", "monitored");
}
export function unavailableBadge(): string {
  return shieldSvg("monitored", "monitored");
}
