// User-auth API client (passwordless magic link + opaque cookie session).
//
// All calls use `credentials: 'include'` so the session cookie flows. In
// production these go through the same-origin /api proxy; in dev they hit
// VITE_API_URL directly (which must allow credentialed CORS).

const BASE_URL = import.meta.env.VITE_API_URL || '';
const CSRF_HEADER = 'X-Slashr-CSRF';

export interface AuthUser {
  email: string;
  plan: string;
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** Request a sign-in link. Always resolves on a 200 (enumeration-resistant). */
export async function requestMagicLink(email: string, turnstileToken: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/auth/request-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, turnstile_token: turnstileToken }),
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, 'Could not send the sign-in link. Please try again.'));
  }
}

/** Exchange a magic-link token for a session (sets the cookie). */
export async function verifyMagicLink(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/v1/auth/verify?token=${encodeURIComponent(token)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, 'This sign-in link is invalid or has expired.'));
  }
  const body = await res.json();
  return body.data as AuthUser;
}

/** Current signed-in user, or null if not authenticated. */
export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(`${BASE_URL}/v1/auth/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to load account.');
  const body = await res.json();
  return body.data as AuthUser;
}

/** Sign out — revokes the session server-side and clears the cookie. */
export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/v1/auth/logout`, {
    method: 'POST',
    headers: { [CSRF_HEADER]: '1' },
    credentials: 'include',
  });
}

// ---- API keys ------------------------------------------------------------

export interface ApiKey {
  id: number;
  key_prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  requests_total: number;
}

/** A freshly minted key — `key` (the raw secret) is shown exactly once. */
export interface CreatedKey {
  id: number;
  name: string;
  key_prefix: string;
  key: string;
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const res = await fetch(`${BASE_URL}/v1/auth/keys`, { credentials: 'include' });
  if (!res.ok) throw new Error(await errorMessage(res, 'Failed to load keys.'));
  return (await res.json()).data as ApiKey[];
}

export async function createApiKey(name: string): Promise<CreatedKey> {
  const res = await fetch(`${BASE_URL}/v1/auth/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [CSRF_HEADER]: '1' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Could not create key.'));
  return (await res.json()).data as CreatedKey;
}

export async function revokeApiKey(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/auth/keys/${id}`, {
    method: 'DELETE',
    headers: { [CSRF_HEADER]: '1' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await errorMessage(res, 'Could not revoke key.'));
}
