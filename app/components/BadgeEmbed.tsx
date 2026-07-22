// "Show you're monitored" — the embed affordance on a validator's Slashr profile (design brief
// section 04). Renders the live shield inline (no network fetch — exact current status) plus
// copy-paste Markdown / HTML / URL snippets with absolute URLs, linking back to this profile.
// Themed with the site's CSS vars (light-first), not the design canvas's dark hex.
import { useState } from "react";
import { validatorBadge, type TrackRecord } from "@/lib/badge";

interface BadgeEmbedProps {
  network: string;
  address: string;
  trackRecord: TrackRecord | null | undefined;
}

type Tab = "md" | "html" | "url";

export function BadgeEmbed({ network, address, trackRecord }: BadgeEmbedProps) {
  const [tab, setTab] = useState<Tab>("md");
  const [copied, setCopied] = useState(false);

  const badgeUrl = `https://slashr.dev/badge/${network}/${address}.svg`;
  const profileUrl = `https://slashr.dev/validator/${network}/${address}`;
  const snippets: Record<Tab, string> = {
    md: `[![Slashr](${badgeUrl})](${profileUrl})`,
    html: `<a href="${profileUrl}">\n  <img src="${badgeUrl}" alt="Slashr — monitored">\n</a>`,
    url: badgeUrl,
  };

  const badgeSvg = validatorBadge(trackRecord, Date.now());

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
    fontSize: 12.5,
    padding: "7px 13px",
    borderRadius: 8,
    cursor: "pointer",
    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
    background: active ? "var(--color-accent-dim)" : "transparent",
    color: active ? "var(--color-accent)" : "var(--color-text-dim)",
    transition: "all .15s ease",
  });

  return (
    <div
      style={{
        marginTop: 40,
        padding: 24,
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        background: "var(--color-bg-card)",
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em", color: "var(--color-text-heading)" }}>
        Show you&rsquo;re monitored
      </div>
      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: "var(--color-text-secondary)", maxWidth: 560 }}>
        Add this badge to your README or site. It updates itself while your record stays clean, and links back
        to this Slashr profile.
      </div>

      {/* Live preview (the exact current shield) + link target */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          padding: 18,
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          background: "var(--color-bg-card)",
        }}
      >
        <span style={{ display: "inline-flex", lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: badgeSvg }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-text-dim)" }}>
          &rarr; links to slashr.dev/validator/{network}/{address}
        </span>
      </div>

      {/* Format tabs */}
      <div style={{ marginTop: 18, display: "flex", gap: 6 }}>
        <button type="button" onClick={() => { setTab("md"); setCopied(false); }} style={tabStyle(tab === "md")}>Markdown</button>
        <button type="button" onClick={() => { setTab("html"); setCopied(false); }} style={tabStyle(tab === "html")}>HTML</button>
        <button type="button" onClick={() => { setTab("url"); setCopied(false); }} style={tabStyle(tab === "url")}>URL</button>
      </div>

      {/* Snippet + copy */}
      <div style={{ marginTop: 10, position: "relative", border: "1px solid var(--color-border)", borderRadius: 10, background: "var(--color-bg-card)" }}>
        <pre
          style={{
            margin: 0,
            padding: "16px 84px 16px 16px",
            overflow: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
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
            top: 10,
            right: 10,
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            padding: "6px 12px",
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

      <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.6, color: "var(--color-text-dim)" }}>
        Prefer a plain mark? Use the generic{" "}
        <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>/badge/monitored.svg</code>{" "}
        &mdash; the neutral state, no per-validator value.
      </div>
    </div>
  );
}
