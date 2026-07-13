import type { Route } from "./+types/api-proxy";
import { apiBase, apiAuthHeaders } from "@/api/upstream.server";

// Same-origin /api/* proxy for browser fetches. Forwards to the API upstream
// (api.slashr.dev + Bearer when the secret is set; slashr.pages.dev/api
// fallback otherwise — see upstream.server.ts). Forwards cookie/CSRF for the
// auth cluster and the real client IP for the API's rate-limiter.
async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/api\/?/, "");
  const target = `${apiBase()}/${rest}${url.search}`;

  const headers = new Headers(apiAuthHeaders());
  headers.set("accept", "application/json");
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const csrf = request.headers.get("x-slashr-csrf");
  if (csrf) headers.set("x-slashr-csrf", csrf);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("x-real-client-ip", ip);

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const res = await fetch(target, init);
  const out = new Headers();
  const rct = res.headers.get("content-type");
  if (rct) out.set("content-type", rct);
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) out.set("set-cookie", setCookie);
  out.set("cache-control", "no-store");
  return new Response(res.body, { status: res.status, headers: out });
}

export async function loader({ request }: Route.LoaderArgs) {
  return proxy(request);
}

export async function action({ request }: Route.ActionArgs) {
  return proxy(request);
}
