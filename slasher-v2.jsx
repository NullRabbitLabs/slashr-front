import { useState, useEffect, useRef } from "react";

const EVENTS = [
  { id: 1, net: "SOL", validator: "Galaxy Digital", addr: "GaLaX...v3Rq", what: "Went dark. 847 votes missed and counting.", severity: "warning", ago: 12, unit: "m", resolved: false, ts: "14:32 UTC" },
  { id: 2, net: "ETH", validator: "Unknown", addr: "0x8f2...4a1c", what: "Double-signed a block. Slashed. 1.05 ETH gone.", severity: "critical", ago: 1, unit: "h", resolved: true, ts: "13:44 UTC" },
  { id: 3, net: "ATOM", validator: "Everstake", what: "Missed 9,500 of the last 10,000 blocks. Jailed.", severity: "warning", ago: 3, unit: "h", resolved: false, ts: "11:02 UTC" },
  { id: 4, net: "SUI", validator: "Mysten Labs", what: "Peer-scored low by other validators.", severity: "warning", ago: 4, unit: "h", resolved: false, ts: "10:18 UTC" },
  { id: 5, net: "SOL", validator: "Chorus One", what: "Went dark. 312 votes missed. Back now.", severity: "warning", ago: 5, unit: "h", resolved: true, ts: "09:41 UTC" },
  { id: 6, net: "ETH", validator: "Lido", what: "Missed attestations during finality delay.", severity: "warning", ago: 6, unit: "h", resolved: true, ts: "08:55 UTC" },
  { id: 7, net: "SOL", validator: "Figment", what: "Went dark. 1,204 votes missed. Back now.", severity: "warning", ago: 8, unit: "h", resolved: true, ts: "06:12 UTC" },
  { id: 8, net: "ATOM", validator: "Informal Systems", what: "Double-signed at the same height. Tombstoned. 487 ATOM burned.", severity: "critical", ago: 11, unit: "h", resolved: true, ts: "03:30 UTC" },
  { id: 9, net: "SOL", validator: "Helius", what: "Went dark. 93 votes missed. Back now.", severity: "warning", ago: 14, unit: "h", resolved: true, ts: "00:15 UTC" },
  { id: 10, net: "ETH", validator: "Kiln", what: "Missed 3 sync committee slots.", severity: "info", ago: 16, unit: "h", resolved: true, ts: "22:40 UTC" },
];

const NETS = {
  SOL: { color: "#14F195", name: "Solana", count: 1893, incidents24h: 18 },
  ETH: { color: "#849DFF", name: "Ethereum", count: "1.04M", incidents24h: 2 },
  ATOM: { color: "#A5A7C4", name: "Cosmos Hub", count: 180, incidents24h: 3 },
  SUI: { color: "#4DA2FF", name: "Sui", count: 107, incidents24h: 5 },
};

function Pulse({ color, active }) {
  return (
    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: active ? color : "rgba(255,255,255,0.15)", boxShadow: active ? `0 0 6px ${color}` : "none", transition: "all 0.4s", flexShrink: 0 }} />
  );
}

function LiveDot() {
  const [on, setOn] = useState(true);
  useEffect(() => { const i = setInterval(() => setOn(v => !v), 1200); return () => clearInterval(i); }, []);
  return <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: on ? "#14F195" : "rgba(20,241,149,0.3)", transition: "background 0.3s", marginRight: 6, flexShrink: 0 }} />;
}

function NetTag({ net }) {
  const n = NETS[net];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px 1px 5px", borderRadius: 3, background: `${n.color}15`, color: n.color, fontSize: 11, fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace", fontWeight: 600, letterSpacing: "0.03em", lineHeight: "18px", flexShrink: 0, border: `1px solid ${n.color}20` }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: n.color, flexShrink: 0 }} />
      {net}
    </span>
  );
}

function SeverityMark({ severity }) {
  if (severity === "critical") return <span style={{ color: "#FF4545", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>slashed</span>;
  if (severity === "info") return null;
  return null;
}

export default function App() {
  const [filter, setFilter] = useState(null);
  const [entered, setEntered] = useState(new Set());
  const feedRef = useRef(null);

  useEffect(() => {
    const ids = EVENTS.map(e => e.id);
    let i = 0;
    const interval = setInterval(() => {
      if (i < ids.length) {
        setEntered(prev => new Set([...prev, ids[i]]));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const filtered = EVENTS.filter(e => !filter || e.net === filter);

  return (
    <div style={{
      background: "#0A0A0B",
      color: "#E8E6E1",
      minHeight: "100vh",
      fontFamily: "'Inter', 'Helvetica Neue', -apple-system, sans-serif",
      padding: "0",
      overflowX: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LiveDot />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
            watching {Object.values(NETS).reduce((a, n) => { const c = typeof n.count === "string" ? 1040000 : n.count; return a + c; }, 0).toLocaleString()} validators
          </span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
          nullrabbit.ai
        </span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>

        {/* Hero */}
        <div style={{ padding: "48px 0 40px" }}>
          <h1 style={{
            fontSize: 48, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.04em", lineHeight: 1,
            fontFamily: "'Space Grotesk', sans-serif",
            background: "linear-gradient(135deg, #E8E6E1 0%, #E8E6E1 40%, #FF4545 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            slasher
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6, maxWidth: 480 }}>
            Every validator penalty, across every major proof-of-stake network, as it happens. No delays. No spin. Just the data.
          </p>
        </div>

        {/* Network strip */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 32, flexWrap: "wrap",
        }}>
          {Object.entries(NETS).map(([key, n], i) => {
            const active = !filter || filter === key;
            const isFirst = i === 0;
            const isLast = i === Object.entries(NETS).length - 1;
            return (
              <button key={key} onClick={() => setFilter(filter === key ? null : key)} style={{
                flex: 1, minWidth: 120,
                background: active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                border: "1px solid",
                borderColor: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                borderRadius: isFirst ? "8px 0 0 8px" : isLast ? "0 8px 8px 0" : 0,
                padding: "12px 14px", cursor: "pointer", textAlign: "left",
                transition: "all 0.2s",
                opacity: active ? 1 : 0.4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Pulse color={n.color} active={active} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? n.color : "rgba(255,255,255,0.4)", transition: "color 0.2s" }}>{key}</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {n.incidents24h} incidents / 24h
                </div>
              </button>
            );
          })}
        </div>

        {/* What is this */}
        <details style={{ marginBottom: 24 }}>
          <summary style={{
            fontSize: 13, color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "8px 0",
            listStyle: "none", fontFamily: "'JetBrains Mono', monospace",
          }}>
            ↳ new to this? what am i looking at?
          </summary>
          <div style={{
            padding: "16px", marginTop: 4, background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
            fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
          }}>
            <p style={{ margin: "0 0 10px" }}>
              Blockchains are kept running by <strong style={{ color: "#E8E6E1", fontWeight: 500 }}>validators</strong> — machines that verify transactions. They put up money as a guarantee they'll behave.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              When they don't — they go offline, sign contradictory data, or act against the network — they get <strong style={{ color: "#E8E6E1", fontWeight: 500 }}>penalised</strong>. Sometimes a slap on the wrist. Sometimes they lose everything.
            </p>
            <p style={{ margin: 0 }}>
              This is a live feed of every penalty event we detect. Across Ethereum, Solana, Cosmos, and Sui. As it happens.
            </p>
          </div>
        </details>

        {/* Feed */}
        <div ref={feedRef}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
            padding: "0 0 8px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              live feed
            </span>
            {filter && (
              <button onClick={() => setFilter(null)} style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3,
                color: "rgba(255,255,255,0.4)", fontSize: 11, padding: "1px 8px", cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                clear filter ✕
              </button>
            )}
          </div>

          {filtered.map((e) => {
            const visible = entered.has(e.id);
            return (
              <div key={e.id} style={{
                padding: "14px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                opacity: visible ? (e.resolved ? 0.4 : 1) : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
                cursor: "pointer",
              }}
              onClick={() => sendPrompt(`Tell me about ${e.validator} on ${NETS[e.net].name}: ${e.what}`)}>

                {/* Timestamp + network + severity */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace", minWidth: 62 }}>
                    {e.ts}
                  </span>
                  <NetTag net={e.net} />
                  <SeverityMark severity={e.severity} />
                  {e.resolved && (
                    <span style={{ fontSize: 10, color: "rgba(20,241,149,0.6)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      resolved
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace" }}>
                    {e.ago}{e.unit} ago
                  </span>
                </div>

                {/* Validator + description */}
                <div style={{ paddingLeft: 70 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#E8E6E1", marginRight: 8 }}>
                    {e.validator}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                    {e.what}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{
          marginTop: 40, padding: "20px 0 40px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span>polling every 30–120s</span>
          <span>built by <span style={{ color: "rgba(255,255,255,0.35)" }}>nullrabbit</span></span>
        </div>
      </div>
    </div>
  );
}
