import type {
  EventListItem,
  NetworkInfo,
  StatsResponse,
  ValidatorProfile,
  LeaderboardResponse,
  LeaderboardPeriod,
  LeaderboardSort,
  ReportProviderItem,
  ReportResponse,
  ChainDataResponse,
  DelegationResponse,
  HealthCheckResponse,
  ScanAnalysisDetail,
  PaginatedResponse,
  DataResponse,
} from '@/types/api';
import { getMockEvents, getMockNetworks, getMockStats, getMockValidator, getMockDelegations, getMockLeaderboard, getMockChainData, getMockHealthCheck } from './mock';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

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
  const query = qs.toString();
  const res = await fetch(`${BASE_URL}/v1/events${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<PaginatedResponse<EventListItem>>;
}

export async function fetchNetworks(): Promise<DataResponse<NetworkInfo[]>> {
  if (USE_MOCK) return getMockNetworks();

  const res = await fetch(`${BASE_URL}/v1/networks`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<NetworkInfo[]>>;
}

export async function fetchStats(): Promise<DataResponse<StatsResponse>> {
  if (USE_MOCK) return getMockStats();

  const res = await fetch(`${BASE_URL}/v1/stats`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<DataResponse<StatsResponse>>;
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

export async function fetchScanAnalysis(eventUuid: string): Promise<ScanAnalysisDetail | null> {
  if (USE_MOCK) return null;

  const res = await fetch(`${BASE_URL}/v1/events/${encodeURIComponent(eventUuid)}/scan-analysis`);
  if (res.status === 404) return null;
  if (!res.ok) return null;

  const json = await res.json() as DataResponse<ScanAnalysisDetail>;
  return json.data;
}
