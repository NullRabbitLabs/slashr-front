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

export interface EventTypeInfo {
  code: string;
  network: string;
  severity: string;
  category: string;
  label: string;
  description: string;
}

export interface EventGroup {
  event: EventListItem;
  count: number;
  eventIds: number[];
  rangeStart: string;
  rangeEnd: string;
}
