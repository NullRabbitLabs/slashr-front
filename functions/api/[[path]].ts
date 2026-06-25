// Cloudflare Pages Function — proxies /api/* to the backend API,
// injecting auth headers.
//
// Required env vars (set in CF Pages dashboard):
//   API_ORIGIN            — e.g. https://api.slashr.dev
//   API_JWT_TOKEN         — JWT bearer token for API auth
//   CF_ACCESS_CLIENT_ID   — from Zero Trust > Service Tokens (legacy, being removed)
//   CF_ACCESS_CLIENT_SECRET

interface Env {
  API_ORIGIN: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
  API_JWT_TOKEN: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  const segments = Array.isArray(params.path)
    ? params.path.join('/')
    : params.path ?? '';
  const url = new URL(request.url);
  const upstream = `${env.API_ORIGIN}/${segments}${url.search}`;

  const headers = new Headers();
  headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
  headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
  headers.set('Accept', 'application/json');
  if (env.API_JWT_TOKEN) {
    headers.set('Authorization', `Bearer ${env.API_JWT_TOKEN}`);
  }

  // Forward real client IP so the API can rate-limit and log per-user.
  // Uses a custom header because CF-Connecting-IP and X-Forwarded-For
  // get overwritten by cloudflared on the tunnel hop.
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) {
    headers.set('X-Real-Client-IP', clientIp);
  }

  // Forward Content-Type for POST/PUT/PATCH requests
  const contentType = request.headers.get('Content-Type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  // Forward the session cookie + CSRF header so the user-auth endpoints
  // (/v1/auth/*) can read the session and enforce CSRF on logout.
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    headers.set('Cookie', cookie);
  }
  const csrf = request.headers.get('X-Slashr-CSRF');
  if (csrf) {
    headers.set('X-Slashr-CSRF', csrf);
  }

  const res = await fetch(upstream, {
    method: request.method,
    headers,
    body: request.body,
  });

  // Pass through the JSON response, stripping any backend CORS headers
  // (same-origin in production, so they're unnecessary)
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', res.headers.get('Content-Type') || 'application/json');
  responseHeaders.set('Cache-Control', res.headers.get('Cache-Control') || 'no-store');

  // Pass through Set-Cookie so session cookies from /v1/auth/verify and the
  // cleared cookie from /v1/auth/logout reach the browser on slashr.dev.
  for (const setCookie of res.headers.getSetCookie()) {
    responseHeaders.append('Set-Cookie', setCookie);
  }

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
};
