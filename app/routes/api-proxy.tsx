import type { Route } from "./+types/api-proxy";

// Zero-secret beta data path: forward /api/* to the existing PUBLIC prod proxy
// at https://slashr.dev/api/* — which already injects CF-Access + Bearer upstream,
// so no secrets are needed on this Worker for a preview deploy.
//
// For the production flip, set BETA_API_UPSTREAM to https://api.slashr.dev and
// inject the real CF-Access + API_JWT_TOKEN secrets here instead of double-hopping.
const UPSTREAM =
  (import.meta.env.VITE_BETA_API_UPSTREAM as string | undefined) ||
  "https://slashr.dev/api";

async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Route is mounted at /api/* — strip the /api prefix and forward the rest.
  const rest = url.pathname.replace(/^\/api\/?/, "");
  const target = `${UPSTREAM}/${rest}${url.search}`;

  const headers = new Headers();
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  headers.set("accept", "application/json");

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);
  const out = new Headers();
  const rct = res.headers.get("content-type");
  if (rct) out.set("content-type", rct);
  out.set("cache-control", "no-store");
  out.set("x-beta-target", target);
  return new Response(res.body, { status: res.status, headers: out });
}

export async function loader({ request }: Route.LoaderArgs) {
  return proxy(request);
}

export async function action({ request }: Route.ActionArgs) {
  return proxy(request);
}
