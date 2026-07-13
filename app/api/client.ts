import type {
  EventListItem,
  NetworkInfo,
  StatsResponse,
  InsightsResponse,
  ValidatorProfile,
  LeaderboardResponse,
  LeaderboardPeriod,
  LeaderboardSort,
  ReportProviderItem,
  ReportResponse,
  RiskListResponse,
  ChainDataResponse,
  DelegationResponse,
  HealthCheckResponse,
  PaginatedResponse,
  DataResponse,
  NetworkSlug,
  SubscribeAlertResponse,
  VerifyAlertResponse,
  UnsubscribeInfoResponse,
  UnsubscribeConfirmResponse,
  ManageAlertsResponse,
} from '@/types/api';
import { getMockEvents, getMockNetworks, getMockStats, getMockValidator, getMockDelegations, getMockLeaderboard, getMockChainData, getMockHealthCheck } from './mock';

// Isomorphic base:
// - Browser: same-origin '/api' proxy (routes/api-proxy.tsx) which forwards to prod.
// - Server (SSR loaders): hit the public prod API directly — no CORS, no secrets.
//   (For the prod flip, swap SSR base to https://api.slashr.dev + inject secrets.)
const BASE_URL = import.meta.env.SSR
  ? 'https://slashr.dev/api'
  : import.meta.env.VITE_API_URL || '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Preview-bypass for gated networks (api side: migration 052).
 * Returns 'all' iff the current URL has ?preview=all, else null.
 *
 * Live-reads window.location each call so SPA navigation to/from the
 * preview URL flips the behaviour immediately. Not cached.
 *
 * SSR-safe fallback (typeof window check) for future build-time
 * prerendering.
 */
function previewParam(): string | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search).get('preview');
  return p === 'all' ? 'all' : null;
}

export async function fetchEvents(params?: {
  network?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}): Promise<PaginatedResponse<EventListItem>> {
  if (USE_MOCK) return getMockEvents(params);

  const qs = new URLSearchParams();
  if (params?.network) qs.set('network', params.network);
  if (params?.search) qs.set('search', params.search);
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  const pv = previewParam();
  if (pv) qs.set('preview', pv);
  const query = qs.toString();
  const res = await fetch(`${BASE_URL}/v1/events${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<PaginatedResponse<EventListItem>>;
}

export async function fetchNetworks(): Promise<DataResponse<NetworkInfo[]>> {
  if (USE_MOCK) return getMockNetworks();

  const pv = previewParam();
  const suffix = pv ? `?preview=${pv}` : '';
  const res = await fetch(`${BASE_URL}/v1/networks${suffix}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<NetworkInfo[]>>;
}

export async function fetchStats(): Promise<DataResponse<StatsResponse>> {
  if (USE_MOCK) return getMockStats();

  const pv = previewParam();
  const suffix = pv ? `?preview=${pv}` : '';
  const res = await fetch(`${BASE_URL}/v1/stats${suffix}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<StatsResponse>>;
}


export async function fetchRiskValidators(params?: {
  network?: string;
  limit?: number;
}): Promise<DataResponse<RiskListResponse>> {
  const qs = new URLSearchParams();
  if (params?.network) qs.set('network', params.network);
  if (params?.limit) qs.set('limit', String(params.limit));
  const pv = previewParam();
  if (pv) qs.set('preview', pv);
  const query = qs.toString();
  const res = await fetch(`${BASE_URL}/v1/risk/validators${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<RiskListResponse>>;
}

export async function fetchInsights(): Promise<DataResponse<InsightsResponse>> {
  const res = await fetch(`${BASE_URL}/v1/insights`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<InsightsResponse>>;
}

export async function fetchValidator(
  network: string,
  address: string,
): Promise<DataResponse<ValidatorProfile>> {
  if (USE_MOCK) return getMockValidator(network, address);

  const res = await fetch(`${BASE_URL}/v1/validators/${encodeURIComponent(network)}/${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<ValidatorProfile>>;
}

export async function resolveShortCode(
  code: string,
): Promise<{ network: string; address: string } | null> {
  const res = await fetch(`${BASE_URL}/v1/validators/short/${encodeURIComponent(code)}`);
  if (!res.ok) return null;
  const json = (await res.json()) as DataResponse<{ network: string; address: string }>;
  return json.data;
}

export async function fetchChainData(
  network: string,
  address: string,
): Promise<DataResponse<ChainDataResponse> | null> {
  if (USE_MOCK) return getMockChainData(network, address);

  const res = await fetch(
    `${BASE_URL}/v1/validators/${encodeURIComponent(network)}/${encodeURIComponent(address)}/chain-data`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<ChainDataResponse>>;
}

export async function fetchLeaderboard(params: {
  network: string;
  period?: LeaderboardPeriod;
  limit?: number;
  sort?: LeaderboardSort;
  page?: number;
  per_page?: number;
}): Promise<DataResponse<LeaderboardResponse>> {
  if (USE_MOCK) return getMockLeaderboard(params.network, params.period, params.sort);

  const qs = new URLSearchParams({ network: params.network });
  if (params.period) qs.set('period', params.period);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const res = await fetch(`${BASE_URL}/v1/rankings?${qs}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<LeaderboardResponse>>;
}

export async function fetchReportProviders(params?: {
  search?: string;
  letter?: string;
  page?: number;
  per_page?: number;
}): Promise<DataResponse<ReportProviderItem[]> & { total?: number }> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.letter) qs.set('letter', params.letter);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.per_page) qs.set('per_page', String(params.per_page));
  const query = qs.toString();
  const res = await fetch(`${BASE_URL}/v1/reports${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<ReportProviderItem[]> & { total?: number }>;
}

export async function fetchReport(
  providerSlug: string,
  period?: string,
): Promise<DataResponse<ReportResponse>> {
  const qs = period ? `?period=${encodeURIComponent(period)}` : '';
  const res = await fetch(`${BASE_URL}/v1/reports/${encodeURIComponent(providerSlug)}${qs}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<ReportResponse>>;
}

export async function fetchDelegations(
  network: string,
  walletAddress: string,
): Promise<DataResponse<DelegationResponse>> {
  if (USE_MOCK) return getMockDelegations(network, walletAddress);

  const res = await fetch(`${BASE_URL}/v1/delegations/${encodeURIComponent(network)}/${encodeURIComponent(walletAddress)}`);
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // Response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<DataResponse<DelegationResponse>>;
}

export async function fetchHealthCheck(
  address: string,
): Promise<DataResponse<HealthCheckResponse>> {
  if (USE_MOCK) return getMockHealthCheck(address);

  const res = await fetch(`${BASE_URL}/v1/health/${encodeURIComponent(address)}`);
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<DataResponse<HealthCheckResponse>>;
}

// API/MCP keys are minted only by signed-in users via the account dashboard
// (see src/api/auth.ts: createApiKey). The anonymous self-serve keygen was
// removed.

// --- Email alerts ---

export async function subscribeAlert(
  email: string,
  targetAddress: string,
  chain?: NetworkSlug,
): Promise<DataResponse<SubscribeAlertResponse>> {
  const body: Record<string, string> = { email, target_address: targetAddress };
  if (chain) body.chain = chain;

  const res = await fetch(`${BASE_URL}/v1/alerts/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) message = data.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<DataResponse<SubscribeAlertResponse>>;
}

export async function verifyAlert(
  token: string,
): Promise<DataResponse<VerifyAlertResponse>> {
  const res = await fetch(`${BASE_URL}/v1/alerts/verify?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) message = data.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<DataResponse<VerifyAlertResponse>>;
}

export async function fetchUnsubscribeInfo(
  token: string,
): Promise<DataResponse<UnsubscribeInfoResponse>> {
  const res = await fetch(`${BASE_URL}/v1/alerts/unsubscribe?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) message = data.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<DataResponse<UnsubscribeInfoResponse>>;
}

export async function confirmUnsubscribe(
  token: string,
): Promise<DataResponse<UnsubscribeConfirmResponse>> {
  const res = await fetch(`${BASE_URL}/v1/alerts/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) message = data.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<DataResponse<UnsubscribeConfirmResponse>>;
}

export async function fetchAlertSubscriptions(
  managementToken: string,
): Promise<DataResponse<ManageAlertsResponse>> {
  const res = await fetch(`${BASE_URL}/v1/alerts/manage?token=${encodeURIComponent(managementToken)}`);
  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) message = data.error.message;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<DataResponse<ManageAlertsResponse>>;
}
