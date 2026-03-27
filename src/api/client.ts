import type {
  EventListItem,
  NetworkInfo,
  StatsResponse,
  ValidatorProfile,
  PaginatedResponse,
  DataResponse,
} from '@/types/api';
import { getMockEvents, getMockNetworks, getMockStats, getMockValidator } from './mock';

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
