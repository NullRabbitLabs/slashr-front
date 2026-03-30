export type NetworkSlug = 'solana' | 'ethereum' | 'cosmos' | 'sui' | 'polkadot';

export type NetworkTicker = 'SOL' | 'ETH' | 'ATOM' | 'SUI' | 'DOT';

export type EventType =
  | 'delinquent'
  | 'slashed'
  | 'inactivity_leak'
  | 'slashed_double_sign'
  | 'slashed_downtime'
  | 'tallying_penalty'
  | 'duplicate_block'
  | 'dot_slashed'
  | 'dot_not_elected';

export type Severity = 'info' | 'warning' | 'critical';

// --- API response envelopes ---

export interface DataResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  limit: number;
  has_more: boolean;
  next_cursor: string | null;
}

export interface ErrorResponse {
  error: { code: string; message: string };
}

// --- Resource types ---

export interface NetworkInfo {
  slug: NetworkSlug;
  name: string;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  poll_interval_secs: number;
}

export interface EventListItem {
  id: number;
  network: NetworkSlug;
  validator_address: string;
  validator_moniker: string | null;
  event_type: EventType;
  severity: Severity;
  started_at: string;
  resolved_at: string | null;
  penalty_amount: number | null;
  penalty_token: string | null;
  validator_stake: number | null;
  validator_stake_token: string | null;
  validator_commission_pct: number | null;
  validator_node_ip: string | null;
  validator_node_hostname: string | null;
  validator_hosting_provider: string | null;
  validator_website: string | null;
  has_contact: boolean;
  in_scan_db: boolean;
}

export interface EventDetail extends EventListItem {
  raw: Record<string, unknown>;
}

export interface ValidatorProfile {
  address: string;
  moniker: string | null;
  network: NetworkSlug;
  first_seen: string;
  last_seen: string;
  metadata: Record<string, unknown>;
  stake: number | null;
  stake_token: string | null;
  commission_pct: number | null;
  node_ip: string | null;
  node_hostname: string | null;
  hosting_provider: string | null;
  website: string | null;
  has_contact: boolean;
  in_scan_db: boolean;
  events: ValidatorEventItem[];
}

export interface ValidatorEventItem {
  id: number;
  event_type: EventType;
  severity: Severity;
  started_at: string;
  resolved_at: string | null;
  penalty_amount: number | null;
  penalty_token: string | null;
}

export interface StatsResponse {
  networks: NetworkStats[];
  totals: StatsCounts;
}

export interface NetworkStats {
  slug: NetworkSlug;
  name: string;
  counts: StatsCounts;
}

export interface StatsCounts {
  last_24h: number;
  last_7d: number;
  last_30d: number;
  all_time: number;
}


export interface EventGroup {
  event: EventListItem;
  count: number;
  eventIds: number[];
  rangeStart: string;
  rangeEnd: string;
}

// --- Leaderboard ---

export type LeaderboardPeriod = '7d' | '30d' | '90d' | 'all';

export type LeaderboardSort = 'best' | 'worst';

export interface LeaderboardEntry {
  address: string;
  moniker: string | null;
  total_events: number;
  events_by_type: Partial<Record<EventType, number>>;
  total_stake: string | null;
  stake_token: string | null;
  severity_score: number;
  rank: number;
}

export interface LeaderboardResponse {
  network: NetworkSlug;
  period: LeaderboardPeriod;
  generated_at: string;
  validators: LeaderboardEntry[];
  total?: number;
}

// --- Report types ---

export interface ReportProviderItem {
  provider_slug: string;
  provider_name: string;
  report_count: number;
  latest_period: string | null;
}

export interface ReportResponse {
  provider_slug: string;
  provider_name: string;
  period: string;
  generated_at: string;
  report: ProviderReport;
  markdown: string;
}

export interface ProviderReport {
  provider: string;
  period: string;
  networks: Record<string, NetworkBreakdown>;
  cross_chain_summary: CrossChainSummary;
  generated_at: string;
}

export interface NetworkBreakdown {
  validators_tracked: number;
  total_events: number;
  events_by_type: Record<string, number>;
  severity_score: number;
  total_stake: string | null;
  worst_incident: WorstIncident | null;
  uptime_estimate_pct: number | null;
}

export interface WorstIncident {
  event_type: string;
  severity: string;
  started_at: string;
  validator_address: string;
  penalty_amount: number | null;
  penalty_token: string | null;
}

export interface CrossChainSummary {
  total_validators: number;
  total_events: number;
  aggregate_severity_score: number;
  aggregate_stake_at_risk: string | null;
}

// --- Delegation lookup types ---

export interface DelegationResponse {
  wallet: string;
  network: string;
  delegations: DelegationItem[];
  note?: string;
}

export interface DelegationItem {
  validator_address: string;
  moniker: string | null;
  stake_amount: string | null;
  stake_token: string | null;
  recent_events: DelegationEvent[];
  severity_score_30d: number;
  slashr_url?: string;
}

export interface DelegationEvent {
  event_type: string;
  severity: Severity;
  started_at: string;
}
