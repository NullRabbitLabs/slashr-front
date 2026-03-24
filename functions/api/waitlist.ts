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

  const payload = {
    email: body.email.trim().toLowerCase(),
    integrations: Array.isArray(body.integrations) ? body.integrations : [],
    other: typeof body.other === 'string' ? body.other.slice(0, 1000) : '',
    submitted_at: new Date().toISOString(),
  };

  const key = `waitlist:${Date.now()}:${payload.email}`;
  try {
    await env.WAITLIST_KV.put(key, JSON.stringify(payload));
  } catch {
    return Response.json({ ok: false, error: 'failed to save' }, { status: 500 });
  }

  return Response.json({ ok: true });
};
