// Server-only (`.server` → stripped from the client bundle). Resolves the API
// upstream + auth headers for all server-side fetches (SSR loaders + the /api
// proxy + feeds/sitemap/og).
//
// - With the API_JWT_TOKEN secret set: hit the tunnel host api.slashr.dev
//   directly (single hop), injecting the Bearer (+ CF-Access if those secrets
//   are also set).
// - Without it: fall back to slashr.pages.dev/api (the Pages proxy, which holds
//   the secrets) so prod keeps working until the Worker secret is configured.
import { env } from "cloudflare:workers";

const e = env as unknown as {
  API_JWT_TOKEN?: string;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
  LOCAL_API_URL?: string;
};

export function apiBase(): string {
  // Local-dev override: point SSR/proxy at a locally-run API (set in .dev.vars).
  // Never set in prod, so this is inert there.
  if (e.LOCAL_API_URL) return e.LOCAL_API_URL;
  return e.API_JWT_TOKEN ? "https://api.slashr.dev" : "https://slashr.pages.dev/api";
}

export function apiAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (e.API_JWT_TOKEN) h["Authorization"] = `Bearer ${e.API_JWT_TOKEN}`;
  if (e.CF_ACCESS_CLIENT_ID) h["CF-Access-Client-Id"] = e.CF_ACCESS_CLIENT_ID;
  if (e.CF_ACCESS_CLIENT_SECRET) h["CF-Access-Client-Secret"] = e.CF_ACCESS_CLIENT_SECRET;
  return h;
}
