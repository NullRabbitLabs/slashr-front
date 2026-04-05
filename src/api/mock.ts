import type {
  EventListItem,
  NetworkInfo,
  StatsResponse,
  ValidatorProfile,
  ChainDataResponse,
  DelegationResponse,
  HealthCheckResponse,
  LeaderboardResponse,
  LeaderboardPeriod,
  LeaderboardSort,
  PaginatedResponse,
  DataResponse,
  NetworkSlug,
} from '@/types/api';

const ENRICHMENT_DEFAULTS = {
  validator_stake: null as number | null,
  validator_stake_token: null as string | null,
  validator_commission_pct: null as number | null,
  validator_node_ip: null as string | null,
  validator_node_hostname: null as string | null,
  validator_hosting_provider: null as string | null,
  validator_website: null as string | null,
  has_contact: false,
  in_scan_db: false,
  loss_per_hour_usd: null as number | null,
  estimated_loss_usd: null as number | null,
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
    node_hostname: null,
    hosting_provider: 'OVH SAS',
    website: 'https://example.com',
    has_contact: true,
    in_scan_db: false,
    skip_rate: network === 'solana' ? 0.023 : null,
    delinquency_frequency: network === 'solana' ? {
      count: 3,
      period_days: 10,
      first_event: '2026-03-24T08:00:00Z',
      last_event: '2026-04-03T12:43:00Z',
    } : null,
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

export function getMockDelegations(network: string, walletAddress: string): DataResponse<DelegationResponse> {
  return {
    data: {
      wallet: walletAddress,
      network,
      delegations: [
        {
          validator_address: 'GaLaXv3RqUPn5tLUYFKV1sd8PoTGwHXrN4xmLCJ1ABdC',
          moniker: 'Galaxy Digital',
          stake_amount: '500.0000',
          stake_token: 'SOL',
          recent_events: [
            { event_type: 'delinquent', severity: 'warning', started_at: '2026-03-25T10:00:00Z' },
          ],
          severity_score_30d: 1,
          slashr_url: `/validator/${network}/GaLaXv3RqUPn5tLUYFKV1sd8PoTGwHXrN4xmLCJ1ABdC`,
        },
        {
          validator_address: 'EVRsTkLp5z1X92KjA7gFd5HJjk6vRz4GR6qCmFJsProject',
          moniker: 'Everstake',
          stake_amount: '2000.0000',
          stake_token: 'SOL',
          recent_events: [],
          severity_score_30d: 0,
        },
        {
          validator_address: 'J2nUHEAgZFRyuJbFjdqPrAa9gyWDPclBcztKN2dR8HXy',
          moniker: null,
          stake_amount: '100.0000',
          stake_token: 'SOL',
          recent_events: [
            { event_type: 'duplicate_block', severity: 'critical', started_at: '2026-03-26T08:30:00Z' },
            { event_type: 'delinquent', severity: 'warning', started_at: '2026-03-24T14:00:00Z' },
          ],
          severity_score_30d: 6,
          slashr_url: `/validator/${network}/J2nUHEAgZFRyuJbFjdqPrAa9gyWDPclBcztKN2dR8HXy`,
        },
      ],
    },
  };
}

export function getMockLeaderboard(
  network: string,
  period?: LeaderboardPeriod,
  _sort?: LeaderboardSort,
): DataResponse<LeaderboardResponse> {
  const slug = network as NetworkSlug;
  return {
    data: {
      network: slug,
      period: period ?? '30d',
      generated_at: '2026-03-28T12:00:00Z',
      validators: [
        { address: 'GaLaXv3Rq', moniker: 'Galaxy Digital', total_events: 12, events_by_type: { delinquent: 12 }, total_stake: '114405', stake_token: 'SOL', severity_score: 3.2, rank: 1 },
        { address: 'ChorusxK9m', moniker: 'Chorus One', total_events: 8, events_by_type: { delinquent: 8 }, total_stake: '89200', stake_token: 'SOL', severity_score: 2.1, rank: 2 },
        { address: 'FigmtpQ2r', moniker: 'Figment', total_events: 5, events_by_type: { delinquent: 5 }, total_stake: '201000', stake_token: 'SOL', severity_score: 1.4, rank: 3 },
        { address: 'StakeFishX', moniker: 'Stakefish', total_events: 3, events_by_type: { delinquent: 3 }, total_stake: '67800', stake_token: 'SOL', severity_score: 0.8, rank: 4 },
        { address: 'EvrstakeAB', moniker: 'Everstake', total_events: 2, events_by_type: { delinquent: 2 }, total_stake: '155000', stake_token: 'SOL', severity_score: 0.5, rank: 5 },
      ],
    },
  };
}

export function getMockChainData(_network: string, _address: string): DataResponse<ChainDataResponse> | null {
  return {
    data: {
      network: 'solana' as NetworkSlug,
      collected_at: new Date().toISOString(),
      chain_data: {
        vote_pubkey: 'AbCdEf123456789',
        node_pubkey: 'XyZ987654321',
        activated_stake_lamports: 779965000000000,
        activated_stake_sol: 779965.0,
        commission: 10,
        last_vote_slot: 402691362,
        root_slot: 402691330,
        epoch_vote_account: true,
        is_delinquent: false,
        credits_current_epoch: 12345,
        credits_previous_epoch: 12300,
        credit_delta: 45,
        skip_rate: 0.023,
      },
      computed: {
        credits_trend: 'improving',
        slots_behind: 32,
      },
    },
  };
}
export async function getMockHealthCheck(_address: string): Promise<DataResponse<HealthCheckResponse>> {
  await new Promise(r => setTimeout(r, 1200));
  return {
    data: {
      address: _address,
      network: 'solana',
      portfolio: {
        grade: 'C',
        score: 58,
        total_stake_usd: 142000,
        total_cost_of_downtime_usd: 412.50,
        cost_period_days: 90,
        validators_at_risk: 2,
        validator_count: 4,
      },
      validators: [
        {
          address: 'HedgehogSpiky111111111111111111111111111111',
          name: 'Hedgehog Spiky',
          stake_amount: 5000,
          stake_token: 'SOL',
          stake_usd: 71000,
          grade: 'F',
          score: 18,
          grade_factors: {
            incident_count_90d: 57,
            total_downtime_hours_90d: 142.5,
            avg_recovery_minutes: 150,
            cve_count: 4,
            exposed_services: 7,
            repeat_failure: true,
          },
          cost_of_downtime: {
            total_usd: 380.25,
            period_days: 90,
            incident_count: 57,
            total_downtime_hours: 142.5,
            estimated: true,
            calculation: { reward_rate_apy: 0.065, token_price_usd: 142.50, stake_tokens: 5000 },
          },
          latest_event: {
            id: 'mock-evt-1',
            event_type: 'delinquent',
            severity: 'warning',
            started_at: new Date(Date.now() - 3600000 * 6).toISOString(),
            duration_minutes: 340,
          },
          scan_summary: {
            health: 'DEGRADED',
            cve_count: 4,
            exposed_services: 7,
            last_scanned: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          alternatives: [
            { address: 'ChorusOne1111111111111111111111111111111111', name: 'Chorus One', grade: 'A', score: 94, commission: 0.08, incident_count_90d: 0 },
            { address: 'Marinade11111111111111111111111111111111111', name: 'Marinade Finance', grade: 'A', score: 97, commission: 0.05, incident_count_90d: 0 },
          ],
        },
        {
          address: 'BadValD1111111111111111111111111111111111111',
          name: 'Low Quality Node',
          stake_amount: 2000,
          stake_token: 'SOL',
          stake_usd: 28400,
          grade: 'D',
          score: 42,
          grade_factors: {
            incident_count_90d: 5,
            total_downtime_hours_90d: 38,
            avg_recovery_minutes: 90,
            cve_count: null,
            exposed_services: null,
            repeat_failure: false,
          },
          cost_of_downtime: {
            total_usd: 32.25,
            period_days: 90,
            incident_count: 5,
            total_downtime_hours: 38,
            estimated: true,
            calculation: { reward_rate_apy: 0.065, token_price_usd: 142.50, stake_tokens: 2000 },
          },
          latest_event: {
            id: 'mock-evt-2',
            event_type: 'delinquent',
            severity: 'warning',
            started_at: new Date(Date.now() - 86400000 * 12).toISOString(),
            resolved_at: new Date(Date.now() - 86400000 * 11).toISOString(),
            duration_minutes: 720,
          },
          scan_summary: null,
          alternatives: [
            { address: 'JitoLabs111111111111111111111111111111111111', name: 'Jito Labs', grade: 'A', score: 96, commission: 0.07, incident_count_90d: 0 },
          ],
        },
        {
          address: 'OkayValB1111111111111111111111111111111111111',
          name: 'Decent Validator',
          stake_amount: 1500,
          stake_token: 'SOL',
          stake_usd: 21300,
          grade: 'B',
          score: 82,
          grade_factors: {
            incident_count_90d: 1,
            total_downtime_hours_90d: 2,
            avg_recovery_minutes: 45,
            cve_count: null,
            exposed_services: null,
            repeat_failure: false,
          },
          cost_of_downtime: {
            total_usd: 0,
            period_days: 90,
            incident_count: 1,
            total_downtime_hours: 2,
            estimated: true,
            calculation: { reward_rate_apy: 0.065, token_price_usd: 142.50, stake_tokens: 1500 },
          },
          latest_event: null,
          scan_summary: null,
          alternatives: [],
        },
        {
          address: 'CleanValA1111111111111111111111111111111111111',
          name: 'Everstake',
          stake_amount: 1500,
          stake_token: 'SOL',
          stake_usd: 21300,
          grade: 'A',
          score: 100,
          grade_factors: {
            incident_count_90d: 0,
            total_downtime_hours_90d: 0,
            avg_recovery_minutes: null,
            cve_count: null,
            exposed_services: null,
            repeat_failure: false,
          },
          cost_of_downtime: {
            total_usd: 0,
            period_days: 90,
            incident_count: 0,
            total_downtime_hours: 0,
            estimated: true,
            calculation: { reward_rate_apy: 0.065, token_price_usd: 142.50, stake_tokens: 1500 },
          },
          latest_event: null,
          scan_summary: null,
          alternatives: [],
        },
      ],
    },
  };
}
