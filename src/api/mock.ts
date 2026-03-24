import type {
  EventListItem,
  NetworkInfo,
  StatsResponse,
  ValidatorProfile,
  PaginatedResponse,
  DataResponse,
  NetworkSlug,
} from '@/types/api';

const ENRICHMENT_DEFAULTS = {
  validator_stake: null as number | null,
  validator_stake_token: null as string | null,
  validator_commission_pct: null as number | null,
  validator_node_ip: null as string | null,
  validator_hosting_provider: null as string | null,
  validator_website: null as string | null,
  has_contact: false,
  in_scan_db: false,
};

const MOCK_EVENTS: EventListItem[] = [
  {
    ...ENRICHMENT_DEFAULTS,
    id: 1,
    network: 'solana',
    validator_address: 'GaLaXv3Rq',
    validator_moniker: 'Galaxy Digital',
    event_type: 'delinquent',
    severity: 'warning',
    started_at: '2026-03-23T14:32:00Z',
    resolved_at: null,
    penalty_amount: null,
    penalty_token: null,
    validator_stake: 114405,
    validator_stake_token: 'SOL',
    validator_commission_pct: 5,
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 2,
    network: 'ethereum',
    validator_address: '0x8f24a1c',
    validator_moniker: null,
    event_type: 'slashed',
    severity: 'critical',
    started_at: '2026-03-23T13:44:00Z',
    resolved_at: '2026-03-23T13:44:00Z',
    penalty_amount: 1.05,
    penalty_token: 'ETH',
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 3,
    network: 'cosmos',
    validator_address: 'cosmo8qzp',
    validator_moniker: 'Everstake',
    event_type: 'slashed_downtime',
    severity: 'warning',
    started_at: '2026-03-23T11:02:00Z',
    resolved_at: null,
    penalty_amount: 0.01,
    penalty_token: 'ATOM',
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 4,
    network: 'sui',
    validator_address: '0x2f8e91a',
    validator_moniker: 'Mysten Labs',
    event_type: 'tallying_penalty',
    severity: 'warning',
    started_at: '2026-03-23T10:18:00Z',
    resolved_at: null,
    penalty_amount: null,
    penalty_token: null,
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 5,
    network: 'solana',
    validator_address: 'ChorusxK9m',
    validator_moniker: 'Chorus One',
    event_type: 'delinquent',
    severity: 'warning',
    started_at: '2026-03-23T09:41:00Z',
    resolved_at: '2026-03-23T09:53:00Z',
    penalty_amount: null,
    penalty_token: null,
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 6,
    network: 'ethereum',
    validator_address: '0xa1c77f2',
    validator_moniker: 'Lido',
    event_type: 'inactivity_leak',
    severity: 'warning',
    started_at: '2026-03-23T08:55:00Z',
    resolved_at: '2026-03-23T09:20:00Z',
    penalty_amount: null,
    penalty_token: 'ETH',
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 7,
    network: 'solana',
    validator_address: 'FigmtpQ2r',
    validator_moniker: 'Figment',
    event_type: 'delinquent',
    severity: 'warning',
    started_at: '2026-03-23T06:12:00Z',
    resolved_at: '2026-03-23T06:30:00Z',
    penalty_amount: null,
    penalty_token: null,
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 8,
    network: 'cosmos',
    validator_address: 'cosmo3kxr',
    validator_moniker: 'Informal Systems',
    event_type: 'slashed_double_sign',
    severity: 'critical',
    started_at: '2026-03-23T03:30:00Z',
    resolved_at: '2026-03-23T03:30:00Z',
    penalty_amount: 487,
    penalty_token: 'ATOM',
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 9,
    network: 'polkadot',
    validator_address: '15kUt2i1E',
    validator_moniker: 'Parity Technologies',
    event_type: 'dot_slashed',
    severity: 'critical',
    started_at: '2026-03-23T07:45:00Z',
    resolved_at: '2026-03-23T07:45:00Z',
    penalty_amount: 1250,
    penalty_token: 'DOT',
  },
  {
    ...ENRICHMENT_DEFAULTS,
    id: 10,
    network: 'polkadot',
    validator_address: '13mK9Fpb7',
    validator_moniker: 'Web3 Foundation',
    event_type: 'dot_not_elected',
    severity: 'warning',
    started_at: '2026-03-23T05:20:00Z',
    resolved_at: null,
    penalty_amount: null,
    penalty_token: null,
  },
];

const MOCK_NETWORKS: NetworkInfo[] = [
  { slug: 'solana',   name: 'Solana',     enabled: true, last_run_at: '2026-03-23T14:30:00Z', last_run_status: 'ok', poll_interval_secs: 30 },
  { slug: 'ethereum', name: 'Ethereum',   enabled: true, last_run_at: '2026-03-23T14:28:00Z', last_run_status: 'ok', poll_interval_secs: 60 },
  { slug: 'cosmos',   name: 'Cosmos Hub', enabled: true, last_run_at: '2026-03-23T14:25:00Z', last_run_status: 'ok', poll_interval_secs: 60 },
  { slug: 'sui',      name: 'Sui',        enabled: true, last_run_at: '2026-03-23T14:20:00Z', last_run_status: 'ok', poll_interval_secs: 120 },
  { slug: 'polkadot', name: 'Polkadot',  enabled: true, last_run_at: '2026-03-23T14:22:00Z', last_run_status: 'ok', poll_interval_secs: 60 },
];

const MOCK_STATS: StatsResponse = {
  networks: [
    { slug: 'solana',   name: 'Solana',     counts: { last_24h: 18, last_7d: 47, last_30d: 189, all_time: 1042 } },
    { slug: 'ethereum', name: 'Ethereum',   counts: { last_24h: 2,  last_7d: 8,  last_30d: 34,  all_time: 156 } },
    { slug: 'cosmos',   name: 'Cosmos Hub', counts: { last_24h: 3,  last_7d: 12, last_30d: 52,  all_time: 287 } },
    { slug: 'sui',      name: 'Sui',        counts: { last_24h: 5,  last_7d: 19, last_30d: 71,  all_time: 203 } },
    { slug: 'polkadot', name: 'Polkadot',  counts: { last_24h: 4,  last_7d: 15, last_30d: 58,  all_time: 312 } },
  ],
  totals: { last_24h: 32, last_7d: 101, last_30d: 404, all_time: 2000 },
};

function buildMockValidator(network: NetworkSlug, address: string): ValidatorProfile {
  const events = MOCK_EVENTS.filter(e => e.network === network && e.validator_address === address);
  const first = events[events.length - 1];
  const last = events[0];
  return {
    address,
    moniker: first?.validator_moniker ?? null,
    network,
    first_seen: first?.started_at ?? '2026-01-15T08:00:00Z',
    last_seen: last?.started_at ?? '2026-03-23T14:00:00Z',
    metadata: {},
    stake: 114405.43,
    stake_token: 'SOL',
    commission_pct: 5,
    node_ip: '64.34.94.207',
    hosting_provider: 'OVH SAS',
    website: 'https://example.com',
    has_contact: true,
    in_scan_db: false,
    events: events.map(e => ({
      id: e.id,
      event_type: e.event_type,
      severity: e.severity,
      started_at: e.started_at,
      resolved_at: e.resolved_at,
      penalty_amount: e.penalty_amount,
      penalty_token: e.penalty_token,
    })),
  };
}

export function getMockEvents(params?: {
  network?: string;
  cursor?: string;
  limit?: number;
}): PaginatedResponse<EventListItem> {
  let filtered = MOCK_EVENTS;
  if (params?.network) {
    filtered = filtered.filter(e => e.network === params.network);
  }
  return {
    data: filtered,
    pagination: { limit: params?.limit ?? 50, has_more: false, next_cursor: null },
  };
}

export function getMockNetworks(): DataResponse<NetworkInfo[]> {
  return { data: MOCK_NETWORKS };
}

export function getMockStats(): DataResponse<StatsResponse> {
  return { data: MOCK_STATS };
}

export function getMockValidator(network: string, address: string): DataResponse<ValidatorProfile> {
  return { data: buildMockValidator(network as NetworkSlug, address) };
}
