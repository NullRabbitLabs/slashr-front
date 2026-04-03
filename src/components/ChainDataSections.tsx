import React from 'react';
import type {
  ChainDataResponse,
  SolanaChainData,
  SuiChainData,
  CosmosChainData,
  EthereumChainData,
} from '@/types/api';

// --- Styles (matching ValidatorProfile patterns) ---

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-heading)',
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '0 0 8px',
  borderBottom: '1px solid var(--color-border)',
  marginBottom: 4,
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-label)',
  fontFamily: "'Inter', sans-serif",
  marginBottom: 2,
};

const metaValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-value)',
  fontFamily: "'JetBrains Mono', monospace",
};

const trendStyle = (trend: string): React.CSSProperties => ({
  fontSize: 11,
  marginLeft: 6,
  color:
    trend === 'improving' || trend === 'gaining'
      ? 'var(--color-accent)'
      : trend === 'declining' || trend === 'losing'
        ? 'var(--color-danger)'
        : 'var(--color-text-dim)',
});

function trendArrow(trend: string | null | undefined): string {
  if (!trend) return '';
  if (trend === 'improving' || trend === 'gaining') return '\u2191';
  if (trend === 'declining' || trend === 'losing') return '\u2193';
  return '\u2192';
}

// --- Helpers ---

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={metaLabelStyle}>{label}</div>
      <div style={metaValueStyle}>{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
  isMobile,
}: {
  title: string;
  children: React.ReactNode;
  isMobile: boolean;
}) {
  return (
    <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ ...sectionHeadingStyle, marginBottom: 12 }}>{title}</div>
      <div
        style={
          isMobile
            ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
            : { display: 'flex', flexWrap: 'wrap' as const, gap: '12px 24px' }
        }
      >
        {children}
      </div>
    </div>
  );
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString();
}

function formatSuiBalance(mist: string | null | undefined): string {
  if (!mist) return '';
  const sui = Number(mist) / 1_000_000_000;
  return `${Math.round(sui).toLocaleString()} SUI`;
}

// --- Per-chain sections ---

function SolanaChainSections({
  data,
  computed,
  isMobile,
}: {
  data: SolanaChainData;
  computed: Record<string, string | number | null>;
  isMobile: boolean;
}) {
  const creditsTrend = computed.credits_trend as string | undefined;

  return (
    <>
      <Section title="Performance" isMobile={isMobile}>
        {data.credits_current_epoch != null && (
          <Field
            label="Epoch Credits"
            value={
              <span>
                {formatNumber(data.credits_current_epoch)}
                {data.credits_previous_epoch != null && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                    prev: {formatNumber(data.credits_previous_epoch)}
                  </span>
                )}
                {data.credit_delta != null && (
                  <span style={{ fontSize: 11, color: 'var(--color-accent)', marginLeft: 6 }}>
                    [{data.credit_delta >= 0 ? '+' : ''}{formatNumber(data.credit_delta)}]
                  </span>
                )}
                {creditsTrend && (
                  <span style={trendStyle(creditsTrend)}>
                    {trendArrow(creditsTrend)}
                  </span>
                )}
              </span>
            }
          />
        )}
        {data.last_vote_slot != null && (
          <Field
            label="Last Vote"
            value={
              <span>
                slot {formatNumber(data.last_vote_slot)}
                {computed.slots_behind != null && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                    ({formatNumber(computed.slots_behind as number)} behind)
                  </span>
                )}
              </span>
            }
          />
        )}
        {data.root_slot != null && <Field label="Root Slot" value={formatNumber(data.root_slot)} />}
        {data.skip_rate != null && (() => {
          const pct = data.skip_rate * 100;
          const color =
            pct < 5
              ? 'var(--color-accent)'
              : pct <= 10
                ? '#e8a735'
                : 'var(--color-danger)';
          return (
            <Field
              label="Skip Rate"
              value={<span style={{ color }}>{pct.toFixed(1)}%</span>}
            />
          );
        })()}
      </Section>

      <Section title="Staking" isMobile={isMobile}>
        {data.activated_stake_sol != null && (
          <Field label="Activated Stake" value={`${formatNumber(Math.round(data.activated_stake_sol))} SOL`} />
        )}
        {data.commission != null && <Field label="Commission" value={`${data.commission}%`} />}
        {data.epoch_vote_account != null && (
          <Field label="Epoch Vote Account" value={data.epoch_vote_account ? 'Active' : 'Inactive'} />
        )}
      </Section>
    </>
  );
}

function SuiChainSections({
  data,
  computed,
  isMobile,
}: {
  data: SuiChainData;
  computed: Record<string, string | number | null>;
  isMobile: boolean;
}) {
  const stakeTrend = computed.stake_trend as string | undefined;

  return (
    <>
      {(data.name || data.description || data.project_url) && (
        <Section title="Identity" isMobile={isMobile}>
          {data.name && <Field label="Name" value={data.name} />}
          {data.description && <Field label="Description" value={data.description} />}
          {data.project_url && (
            <Field
              label="Project"
              value={
                <a
                  href={data.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-text-value)', textDecoration: 'underline' }}
                >
                  {data.project_url.replace(/^https?:\/\//, '')}
                </a>
              }
            />
          )}
        </Section>
      )}

      <Section title="Performance" isMobile={isMobile}>
        {data.voting_power != null && (
          <Field
            label="Voting Power"
            value={
              <span>
                {formatNumber(data.voting_power)}
                {computed.voting_power_pct && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                    ({computed.voting_power_pct})
                  </span>
                )}
              </span>
            }
          />
        )}
        {data.gas_price != null && <Field label="Gas Price" value={`${data.gas_price} MIST`} />}
        {data.apy_bps != null && <Field label="APY" value={`${(data.apy_bps / 100).toFixed(2)}%`} />}
        {computed.at_risk_display != null && <Field label="At Risk" value={computed.at_risk_display as string} />}
      </Section>

      <Section title="Staking" isMobile={isMobile}>
        {data.staking_pool_sui_balance && (
          <Field label="Current Pool" value={formatSuiBalance(data.staking_pool_sui_balance)} />
        )}
        {data.next_epoch_stake && (
          <Field
            label="Next Epoch Stake"
            value={
              <span>
                {formatSuiBalance(data.next_epoch_stake)}
                {stakeTrend && <span style={trendStyle(stakeTrend)}>{trendArrow(stakeTrend)}</span>}
              </span>
            }
          />
        )}
        {data.commission_rate_bps != null && (
          <Field
            label="Commission"
            value={
              <span>
                {(data.commission_rate_bps / 100).toFixed(0)}%
                {data.next_epoch_commission_rate_bps != null &&
                  data.next_epoch_commission_rate_bps !== data.commission_rate_bps && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                      next: {(data.next_epoch_commission_rate_bps / 100).toFixed(0)}%
                    </span>
                  )}
              </span>
            }
          />
        )}
        {data.pending_stake && <Field label="Pending Stake" value={formatSuiBalance(data.pending_stake)} />}
        {data.pending_total_sui_withdraw && (
          <Field label="Pending Withdrawals" value={formatSuiBalance(data.pending_total_sui_withdraw)} />
        )}
        {data.rewards_pool && <Field label="Rewards Pool" value={formatSuiBalance(data.rewards_pool)} />}
      </Section>
    </>
  );
}

function CosmosChainSections({
  data,
  computed,
  isMobile,
}: {
  data: CosmosChainData;
  computed: Record<string, string | number | null>;
  isMobile: boolean;
}) {
  return (
    <>
      <Section title="Status" isMobile={isMobile}>
        {data.status && (
          <Field
            label="Status"
            value={data.status.replace('BOND_STATUS_', '').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
          />
        )}
        {data.jailed != null && (
          <Field label="Jailed" value={data.jailed ? 'Yes' : 'No'} />
        )}
        {data.signing_info?.tombstoned != null && (
          <Field label="Tombstoned" value={data.signing_info.tombstoned ? 'Yes' : 'No'} />
        )}
      </Section>

      {(computed.uptime_pct != null || computed.jail_risk != null) && (
        <Section title="Performance" isMobile={isMobile}>
          {computed.uptime_pct != null && (
            <Field
              label="Uptime"
              value={
                <span>
                  {computed.uptime_pct}
                  {data.signing_info?.missed_blocks_counter && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                      ({data.signing_info.missed_blocks_counter} missed of 10,000)
                    </span>
                  )}
                </span>
              }
            />
          )}
          {computed.jail_risk != null && (
            <Field
              label="Jail Risk"
              value={
                <span
                  style={{
                    color:
                      computed.jail_risk === 'low'
                        ? 'var(--color-accent)'
                        : 'var(--color-danger)',
                  }}
                >
                  {(computed.jail_risk as string).charAt(0).toUpperCase() + (computed.jail_risk as string).slice(1)}
                </span>
              }
          />
        )}
        </Section>
      )}

      <Section title="Staking" isMobile={isMobile}>
        {data.tokens && (
          <Field
            label="Tokens"
            value={
              <span>
                {formatNumber(Number(data.tokens))} uatom
                <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                  ({formatNumber(Math.round(Number(data.tokens) / 1_000_000))} ATOM)
                </span>
              </span>
            }
          />
        )}
        {data.commission_rate && (
          <Field
            label="Commission"
            value={
              <span>
                {(parseFloat(data.commission_rate) * 100).toFixed(0)}%
                {data.commission_max_rate && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                    max {(parseFloat(data.commission_max_rate) * 100).toFixed(0)}%
                    {data.commission_max_change_rate && (
                      <>, max change {(parseFloat(data.commission_max_change_rate) * 100).toFixed(0)}%/day</>
                    )}
                  </span>
                )}
              </span>
            }
          />
        )}
        {data.min_self_delegation && (
          <Field label="Min Self Delegation" value={`${formatNumber(Number(data.min_self_delegation))} ATOM`} />
        )}
        {data.delegator_shares && (
          <Field label="Delegator Shares" value={formatNumber(Math.round(parseFloat(data.delegator_shares)))} />
        )}
      </Section>
    </>
  );
}

function EthereumChainSections({
  data,
  computed,
  isMobile,
}: {
  data: EthereumChainData;
  computed: Record<string, string | number | null>;
  isMobile: boolean;
}) {
  return (
    <>
      <Section title="Status" isMobile={isMobile}>
        {computed.status_display != null && <Field label="Status" value={computed.status_display as string} />}
        {data.activation_epoch != null && (
          <Field label="Activation Epoch" value={formatNumber(data.activation_epoch)} />
        )}
        {data.slashed != null && (
          <Field
            label="Slashed"
            value={
              <span style={{ color: data.slashed ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                {data.slashed ? 'Yes' : 'No'}
              </span>
            }
          />
        )}
      </Section>

      <Section title="Balance" isMobile={isMobile}>
        {computed.balance_eth != null && <Field label="Balance" value={`${computed.balance_eth} ETH`} />}
        {data.effective_balance_gwei != null && (
          <Field
            label="Effective Balance"
            value={`${(data.effective_balance_gwei / 1_000_000_000).toFixed(3)} ETH`}
          />
        )}
      </Section>
    </>
  );
}

// --- Main export ---

interface ChainDataSectionsProps {
  chainData: ChainDataResponse;
  isMobile: boolean;
}

export function ChainDataSections({ chainData, isMobile }: ChainDataSectionsProps) {
  const { network, chain_data, computed } = chainData;
  const cd = chain_data as Record<string, unknown>;

  switch (network) {
    case 'solana':
      return <SolanaChainSections data={cd as unknown as SolanaChainData} computed={computed} isMobile={isMobile} />;
    case 'sui':
      return <SuiChainSections data={cd as unknown as SuiChainData} computed={computed} isMobile={isMobile} />;
    case 'cosmos':
      return <CosmosChainSections data={cd as unknown as CosmosChainData} computed={computed} isMobile={isMobile} />;
    case 'ethereum':
      return (
        <EthereumChainSections data={cd as unknown as EthereumChainData} computed={computed} isMobile={isMobile} />
      );
    default:
      return null;
  }
}
