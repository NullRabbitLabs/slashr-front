import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Mirrors the SPA route table (App.tsx on main), expressed as RR7 framework
// routes. Public data pages get server loaders (added incrementally); the
// auth/cookie cluster stays client-rendered.
export default [
  index("routes/home.tsx"),
  // Same-origin API proxy → forwards /api/* to the public prod endpoint
  // (zero-secret beta data path). Resource route: no default component.
  route("api/*", "routes/api-proxy.tsx"),
  // Machine-readable feeds + sitemap (ported from Pages Functions).
  route("feed/incidents.rss", "routes/feed.incidents.rss.tsx"),
  route("feed/incidents.json", "routes/feed.incidents.json.tsx"),
  route("sitemap.xml", "routes/sitemap.tsx"),
  // Dynamic per-validator OG image (satori + resvg WASM).
  route("og/:network/:address", "routes/og.tsx"),
  route("risk", "routes/risk.tsx"),
  route("feed", "routes/feed.tsx"),
  route("check", "routes/check.tsx"),
  route("validators", "routes/validators.tsx"),
  route("networks/:network/validators", "routes/networks.$network.validators.tsx"),
  route("validator/:network/:address", "routes/validator.tsx"),
  route("reports", "routes/reports.tsx"),
  route("reports/providers", "routes/reports.providers.tsx"),
  route("reports/:providerSlug", "routes/reports.detail.tsx"),
  route("rankings", "routes/rankings.tsx"),
  route("insights", "routes/insights.tsx"),
  route("developers", "routes/developers.tsx"),
  route("v/:code", "routes/short.tsx"),
  route("leaderboard", "routes/leaderboard.tsx"),
  route("alerts", "routes/alerts.tsx"),
  route("alerts/verify", "routes/alerts.verify.tsx"),
  route("alerts/unsubscribe", "routes/alerts.unsubscribe.tsx"),
  route("alerts/manage", "routes/alerts.manage.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/verify", "routes/auth.verify.tsx"),
  route("account", "routes/account.tsx"),
] satisfies RouteConfig;
