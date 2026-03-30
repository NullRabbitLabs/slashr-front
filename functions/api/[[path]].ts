// Cloudflare Pages Function — proxies /api/* to the backend API,
// injecting CF Access service token headers.
//
// Required env vars (set in CF Pages dashboard):
//   API_ORIGIN            — e.g. https://api.slashr.dev
//   CF_ACCESS_CLIENT_ID   — from Zero Trust > Service Tokens
//   CF_ACCESS_CLIENT_SECRET

interface Env {
  API_ORIGIN: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
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

  // Forward real client IP so the API can rate-limit and log per-user.
  // Uses a custom header because CF-Connecting-IP and X-Forwarded-For
  // get overwritten by cloudflared on the tunnel hop.
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) {
    headers.set('X-Real-Client-IP', clientIp);
  }

  const res = await fetch(upstream, {
    method: request.method,
    headers,
  });

  // Pass through the JSON response, stripping any backend CORS headers
  // (same-origin in production, so they're unnecessary)
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', res.headers.get('Content-Type') || 'application/json');
  responseHeaders.set('Cache-Control', res.headers.get('Cache-Control') || 'no-store');

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
};
