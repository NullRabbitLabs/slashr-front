// "Show you're monitored" — the embed affordance for a validator's Slashr badge (design brief
// section 04). Copy-paste Markdown / HTML / URL, absolute URLs, linking back to the profile.
// Used both on the full profile page and in the risk drawer, so:
//  - trackRecord provided (profile) -> render the exact shield INLINE (SSR, no fetch, no shift).
//  - trackRecord omitted (drawer)   -> render the live served badge via <img>.
// `compact` tightens it for the drawer. Themed with the site's CSS vars (light-first).
//
// The badge preview is always shown; the embed machinery (code tabs + instructions) is collapsed
// behind a chevron so the profile page isn't dominated by it.
import { useState } from "react";
import { validatorBadge, type TrackRecord } from "@/lib/badge";

interface BadgeEmbedProps {
  network: string;
  address: string;
  trackRecord?: TrackRecord | null;
  compact?: boolean;
}

type Tab = "md" | "html" | "url";

export function BadgeEmbed({ network, address, trackRecord, compact = false }: BadgeEmbedProps) {
  const [tab, setTab] = useState<Tab>("md");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const badgeUrl = `https://slashr.dev/badge/${network}/${address}.svg`;
  const profileUrl = `https://slashr.dev/validator/${network}/${address}`;
  const snippets: Record<Tab, string> = {
    md: `[![Slashr](${badgeUrl})](${profileUrl})`,
    html: `<a href="${profileUrl}">\n  <img src="${badgeUrl}" alt="Slashr — monitored">\n</a>`,
    url: badgeUrl,
  };

  const copy = () => {
    try {
      navigator.clipboard?.writeText(snippets[tab]);
    } catch {
      /* clipboard unavailable — no-op */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 8,
    cursor: "pointer",
    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
    background: active ? "var(--color-accent-dim)" : "transparent",
    color: active ? "var(--color-accent)" : "var(--color-text-dim)",
    transition: "all .15s ease",
  });

  const preview =
    trackRecord !== undefined ? (
      <span
        style={{ display: "inline-flex", lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: validatorBadge(trackRecord, Date.now()) }}
      />
    ) : (
      <img src={`/badge/${network}/${address}.svg`} alt="Slashr — monitored" height={20} style={{ display: "inline-block" }} />
    );

  return (
    <div
      style={{
        marginTop: compact ? 20 : 40,
        padding: compact ? 16 : 24,
        border: "1px solid var(--color-border)",
        borderRadius: compact ? 12 : 14,
        background: "var(--color-bg-card)",
      }}
    >
      <div style={{ fontSize: compact ? 14 : 17, fontWeight: 700, letterSpacing: "-.01em", color: "var(--color-text-heading)" }}>
        Show you&rsquo;re monitored
      </div>

      {/* The badge itself — always visible. */}
      <div
        style={{
          marginTop: compact ? 12 : 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          padding: compact ? 12 : 18,
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          background: "var(--color-bg-card)",
        }}
      >
        {preview}
        {!compact && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)" }}>
            &rarr; links to slashr.dev/validator/{network}/{address}
          </span>
        )}
      </div>

      {/* Everything else (copy-paste embed + notes) is collapsed by default. */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        style={{
          marginTop: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          font: "inherit",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text-secondary)",
        }}
      >
        {expanded ? "Hide embed code" : "Embed this badge"}
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div style={{ marginTop: 4 }}>
          {!compact && (
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: "var(--color-text-secondary)", maxWidth: 560 }}>
              Add this badge to your README or site. It updates itself while your record stays clean, and links back
              to this Slashr profile.
            </div>
          )}

          <div style={{ marginTop: compact ? 12 : 16, display: "flex", gap: 6 }}>
            <button type="button" onClick={() => { setTab("md"); setCopied(false); }} style={tabStyle(tab === "md")}>Markdown</button>
            <button type="button" onClick={() => { setTab("html"); setCopied(false); }} style={tabStyle(tab === "html")}>HTML</button>
            <button type="button" onClick={() => { setTab("url"); setCopied(false); }} style={tabStyle(tab === "url")}>URL</button>
          </div>

          <div style={{ marginTop: 10, position: "relative", border: "1px solid var(--color-border)", borderRadius: 10, background: "var(--color-bg-card)" }}>
            <pre
              style={{
                margin: 0,
                padding: "14px 78px 14px 14px",
                overflow: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                lineHeight: 1.6,
                color: "var(--color-text-body)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {snippets[tab]}
            </pre>
            <button
              type="button"
              onClick={copy}
              style={{
                position: "absolute",
                top: 9,
                right: 9,
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                padding: "6px 11px",
                borderRadius: 7,
                cursor: "pointer",
                border: `1px solid ${copied ? "var(--ok)" : "var(--color-border)"}`,
                background: copied ? "var(--ok-soft)" : "var(--color-bg-card)",
                color: copied ? "var(--ok)" : "var(--color-text-secondary)",
              }}
            >
              {copied ? "copied ✓" : "copy"}
            </button>
          </div>

          {!compact && (
            <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text-dim)" }}>
              Prefer a plain mark? Use the generic{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>/badge/monitored.svg</code>{" "}
              &mdash; the neutral state, no per-validator value.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
