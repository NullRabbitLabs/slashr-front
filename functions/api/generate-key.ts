// Cloudflare Pages Function — keygen proxy with Turnstile verification
//
// Verifies the Turnstile captcha token, then proxies the request
// to the MCP server's keygen endpoint. Keeps captcha logic out of the
// Rust backend.
//
// Environment variables (set in Cloudflare Pages dashboard):
//   TURNSTILE_SECRET_KEY — Cloudflare Turnstile secret key
//   MCP_ORIGIN           — e.g. https://mcp.slashr.dev (defaults to this)

interface Env {
  TURNSTILE_SECRET_KEY: string;
  MCP_ORIGIN?: string;
}

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Parse body
  let body: { turnstile_token?: string } = {};
  try {
    body = await request.json() as typeof body;
  } catch {
    // empty body is fine
  }

  // Verify Turnstile
  if (!env.TURNSTILE_SECRET_KEY) {
    return Response.json(
      { error: 'captcha verification not configured' },
      { status: 503 },
    );
  }

  const token = body.turnstile_token;
  if (!token) {
    return Response.json(
      { error: 'captcha_required', message: 'Human verification required.' },
      { status: 400 },
    );
  }

  const ip = request.headers.get('cf-connecting-ip') || '';

  const verifyRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    },
  );

  const verify: TurnstileVerifyResponse = await verifyRes.json();
  if (!verify.success) {
    return Response.json(
      { error: 'captcha_failed', message: 'Captcha verification failed. Please try again.' },
      { status: 403 },
    );
  }

  // Proxy to MCP keygen endpoint
  const mcpOrigin = env.MCP_ORIGIN || 'https://mcp.slashr.dev';

  const upstream = await fetch(`${mcpOrigin}/mcp/keys/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
      'X-Real-Client-IP': ip,
    },
    body: '{}',
  });

  const data = await upstream.text();

  return new Response(data, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json',
      ...(upstream.headers.get('retry-after')
        ? { 'Retry-After': upstream.headers.get('retry-after')! }
        : {}),
    },
  });
};
