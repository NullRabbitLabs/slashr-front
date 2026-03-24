// Cloudflare Pages Function — waitlist signup
//
// OPERATOR NOTE: Before deploying, add a KV namespace binding named WAITLIST_KV
// in the Cloudflare Pages dashboard (Settings → Functions → KV namespace bindings)
// and in wrangler.toml:
//   [[kv_namespaces]]
//   binding = "WAITLIST_KV"
//   id = "<your-namespace-id>"

interface Env {
  WAITLIST_KV: KVNamespace;
}

interface WaitlistBody {
  email: string;
  integrations: string[];
  other: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limit: 1 submission per IP per 60s, 3 per email per hour
const IP_WINDOW_S = 60;
const EMAIL_WINDOW_S = 3600;
const EMAIL_MAX = 3;

async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  email: string,
): Promise<string | null> {
  // Per-IP: simple cooldown
  const ipKey = `rl:ip:${ip}`;
  const ipHit = await kv.get(ipKey);
  if (ipHit) return 'too many requests — try again shortly';

  // Per-email: sliding counter
  const emailKey = `rl:email:${email}`;
  const emailRaw = await kv.get(emailKey);
  const emailCount = emailRaw ? parseInt(emailRaw, 10) : 0;
  if (emailCount >= EMAIL_MAX) return 'this email has already been registered';

  return null;
}

async function recordRateLimit(
  kv: KVNamespace,
  ip: string,
  email: string,
): Promise<void> {
  const ipKey = `rl:ip:${ip}`;
  const emailKey = `rl:email:${email}`;

  const emailRaw = await kv.get(emailKey);
  const emailCount = emailRaw ? parseInt(emailRaw, 10) : 0;

  await Promise.all([
    kv.put(ipKey, '1', { expirationTtl: IP_WINDOW_S }),
    kv.put(emailKey, String(emailCount + 1), { expirationTtl: EMAIL_WINDOW_S }),
  ]);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) {
    return Response.json({ ok: false, error: 'expected json' }, { status: 400 });
  }

  let body: WaitlistBody;
  try {
    body = await request.json() as WaitlistBody;
  } catch {
    return Response.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }

  if (!body.email || !EMAIL_RE.test(body.email)) {
    return Response.json({ ok: false, error: 'invalid email' }, { status: 400 });
  }

  if (!env.WAITLIST_KV) {
    return Response.json({ ok: false, error: 'KV binding not configured' }, { status: 503 });
  }

  const email = body.email.trim().toLowerCase();
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  const rateLimitError = await checkRateLimit(env.WAITLIST_KV, ip, email);
  if (rateLimitError) {
    return Response.json({ ok: false, error: rateLimitError }, { status: 429 });
  }

  const payload = {
    email,
    integrations: Array.isArray(body.integrations) ? body.integrations : [],
    other: typeof body.other === 'string' ? body.other.slice(0, 1000) : '',
    submitted_at: new Date().toISOString(),
    ip,
  };

  const key = `waitlist:${Date.now()}:${email}`;
  try {
    await Promise.all([
      env.WAITLIST_KV.put(key, JSON.stringify(payload)),
      recordRateLimit(env.WAITLIST_KV, ip, email),
    ]);
  } catch {
    return Response.json({ ok: false, error: 'failed to save' }, { status: 500 });
  }

  return Response.json({ ok: true });
};
