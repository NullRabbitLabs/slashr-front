import React, { useState } from 'react';
import type {
  ChainDataResponse,
  SolanaChainData,
  SuiChainData,
  CosmosChainData,
  EthereumChainData,
  PolkadotChainData,
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
  helpContent,
}: {
  title: string;
  children: React.ReactNode;
  isMobile: boolean;
  helpContent?: React.ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ ...sectionHeadingStyle, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
        {helpContent && (
          <button
            onClick={() => setHelpOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--color-text-dim)',
              fontFamily: "'JetBrains Mono', monospace",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ?
          </button>
        )}
      </div>
      <div
        style={
          isMobile
            ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
            : { display: 'flex', flexWrap: 'wrap' as const, gap: '12px 24px' }
        }
      >
        {children}
      </div>

      {helpContent && helpOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            background: 'var(--color-overlay)',
          }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-medium)',
              borderRadius: isMobile ? '12px 12px 0 0' : 8,
              padding: isMobile ? '24px 20px 32px' : '32px 28px',
              width: isMobile ? '100%' : 420,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.02em',
                margin: 0,
                color: 'var(--color-text-primary)',
              }}>
                What do these numbers mean?
              </h3>
              <button
                onClick={() => setHelpOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: 'var(--color-text-dim)',
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.7,
            }}>
              {helpContent}
            </div>
          </div>
        </div>
      )}
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

function formatUnbondingTime(raw: string): string {
  const ms = new Date(raw).getTime();
  if (isNaN(ms)) return raw;

  // Epoch-zero sentinel means the validator is not unbonding
  if (ms <= 0) return '';

  const diffMs = ms - Date.now();
  if (diffMs <= 0) return 'expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  if (days > 0 && hours > 0) return `${days}d ${hours}h remaining`;
  if (days > 0) return `${days} days remaining`;
  if (hours > 0) return `${hours} hours remaining`;
  return 'less than an hour remaining';
}

const ETH_BEACON_GENESIS = new Date('2020-09-01T00:00:00Z').getTime();
const SECONDS_PER_EPOCH = 384;
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function isEthSentinel(epoch: number | null | undefined): boolean {
  if (epoch == null) return true;
  return epoch >= 1e18;
}

function epochToApproxDate(epoch: number): string {
  const ms = ETH_BEACON_GENESIS + epoch * SECONDS_PER_EPOCH * 1000;
  const d = new Date(ms);
  return `~${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
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
      {data.is_delinquent && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          background: 'rgba(255, 69, 69, 0.15)',
          border: '1px solid rgba(255, 69, 69, 0.30)',
          borderRadius: 4,
          marginBottom: 16,
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-danger)',
            boxShadow: '0 0 6px var(--color-danger)',
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-danger)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            DELINQUENT
          </span>
        </div>
      )}

      <Section
        title="Performance"
        isMobile={isMobile}
        helpContent={
          <>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Epoch Credits</strong>: A running score of how many votes this validator has successfully cast. Higher is better. The <code style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>prev:</code> value is last epoch's score; the delta shows whether performance is improving or declining.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Last Vote</strong>: The most recent slot this validator voted on. If this is far behind the current slot, the validator may be falling behind the network.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Root Slot</strong>: The last slot this validator has confirmed as finalised. Should track close to Last Vote. A large gap between Root Slot and Last Vote can indicate sync issues.
            </p>
            <p style={{ margin: 0 }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Improving / Declining</strong>: Compares this epoch's credits to last epoch's. An improving validator is catching up; a declining one is falling further behind.
            </p>
          </>
        }
      >
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
                    {trendArrow(creditsTrend)} {creditsTrend}
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
        {data.skip_rate != null && data.skip_rate > 0 && (() => {
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
        {data.software_version && (() => {
          const isTest = /alpha|beta|test/i.test(data.software_version);
          // Mirror of slasher-solana's classify_jito_version: any version
          // containing "jito" (case-insensitive) is Jito-Solana; anything
          // else is vanilla Agave. Vanilla validators forfeit MEV tip
          // revenue that would otherwise flow to delegators - that's the
          // chip's product story. We deliberately do not chip "Jito" as
          // green because being on Jito is the expected state, not an
          // achievement; we only call out the deviation.
          const isJito = /jito/i.test(data.software_version);
          return (
            <Field
              label="Software"
              value={
                <span style={{ color: isTest ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                  {data.software_version}
                  {isTest && (
                    <span style={{ fontSize: 10, marginLeft: 8, color: 'var(--color-danger)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      pre-release
                    </span>
                  )}
                  {!isJito && !isTest && (
                    <span
                      title="Running stock Agave (vanilla Solana) instead of Jito-Solana, MEV tip revenue that could flow to delegators is forfeited."
                      style={{
                        fontSize: 10,
                        marginLeft: 8,
                        padding: '2px 6px',
                        background: 'rgba(232, 167, 53, 0.15)',
                        border: '1px solid rgba(232, 167, 53, 0.30)',
                        borderRadius: 3,
                        color: '#e8a735',
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        cursor: 'help',
                      }}
                    >
                      vanilla
                    </span>
                  )}
                </span>
              }
            />
          );
        })()}
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
  const [showFullDetails, setShowFullDetails] = useState(false);
  // description fields may be top-level (flattened) or nested under description
  const desc = (data as unknown as Record<string, unknown>).description as Record<string, unknown> | undefined;
  const website = data.website ?? desc?.website as string | undefined;
  const details = data.details ?? desc?.details as string | undefined;
  const hasIdentity = !!(website?.trim() || details?.trim());

  return (
    <>
      {hasIdentity && (
        <Section title="Identity" isMobile={isMobile}>
          {website?.trim() && (
            <Field
              label="Website"
              value={
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-text-value)', textDecoration: 'underline' }}
                >
                  {website.replace(/^https?:\/\//, '')}
                </a>
              }
            />
          )}
          {details?.trim() && (
            <div style={isMobile ? { gridColumn: 'span 2' } : undefined}>
              <div style={metaLabelStyle}>Details</div>
              <div style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.5,
              }}>
                {details.length > 200 && !showFullDetails ? (
                  <>
                    {details.slice(0, 200)}...
                    <button
                      onClick={() => setShowFullDetails(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontFamily: "'Inter', sans-serif",
                        textDecoration: 'underline',
                        marginLeft: 4,
                        padding: 0,
                      }}
                    >
                      show more
                    </button>
                  </>
                ) : (
                  details
                )}
              </div>
            </div>
          )}
        </Section>
      )}

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
        {data.unbonding_time && formatUnbondingTime(data.unbonding_time) && (
          <Field label="Unbonding Time" value={formatUnbondingTime(data.unbonding_time)} />
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
        {!isEthSentinel(data.exit_epoch) && (
          <Field
            label="Exit Epoch"
            value={
              <span>
                {formatNumber(data.exit_epoch!)}
                <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                  ({epochToApproxDate(data.exit_epoch!)})
                </span>
              </span>
            }
          />
        )}
        {!isEthSentinel(data.withdrawable_epoch) && (
          <Field
            label="Withdrawable Epoch"
            value={
              <span>
                {formatNumber(data.withdrawable_epoch!)}
                <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 6 }}>
                  ({epochToApproxDate(data.withdrawable_epoch!)})
                </span>
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

/// Convert planck (u128 wire-string) to a human-readable DOT figure.
/// Uses BigInt to avoid Number's 53-bit precision ceiling - top
/// validators have stake well above 2^53 planck.
function planckToDot(planckStr: string): string {
  try {
    const planck = BigInt(planckStr);
    const denom = 10_000_000_000n; // 10^10
    const whole = planck / denom;
    const frac = planck % denom;
    // Show 4 fractional digits - beyond that the value is noise for UI.
    const fracStr = (frac / 1_000_000n).toString().padStart(4, '0');
    return `${whole.toLocaleString()}.${fracStr}`;
  } catch {
    return planckStr;
  }
}

function PolkadotChainSections({
  data,
  isMobile,
}: {
  data: PolkadotChainData;
  isMobile: boolean;
}) {
  // Replaces the demoted dot_not_elected feed event. Render only when
  // the worker has populated chain_data.is_elected - during the deploy
  // gap window where worker is_elected hasn't reached prod yet,
  // undefined would render falsy and incorrectly show "No". Better to
  // render nothing than to show wrong data.
  if (typeof data.is_elected !== 'boolean') {
    return null;
  }
  return (
    <>
      <Section title="Active Set" isMobile={isMobile}>
        <Field
          label="Currently Elected"
          value={
            <span style={{ color: data.is_elected ? 'var(--color-accent)' : 'var(--color-danger)' }}>
              {data.is_elected ? 'Yes' : 'No'}
            </span>
          }
        />
        {data.observed_at_block != null && (
          <Field label="Observed at Block" value={formatNumber(data.observed_at_block)} />
        )}
      </Section>

      {data.validator_prefs && (
        <Section title="Validator Preferences" isMobile={isMobile}>
          <Field
            label="Commission"
            value={`${(data.validator_prefs.commission_bps / 100).toFixed(2)}%`}
          />
          <Field
            label="Accepting Nominations"
            value={
              <span
                style={{
                  color: data.validator_prefs.blocked ? 'var(--color-danger)' : 'var(--color-accent)',
                }}
              >
                {data.validator_prefs.blocked ? 'No (blocked)' : 'Yes'}
              </span>
            }
          />
        </Section>
      )}

      {data.era_exposure && (
        <Section title="Era Exposure" isMobile={isMobile}>
          <Field label="Era" value={formatNumber(data.era_exposure.era_index)} />
          <Field label="Total Stake" value={`${planckToDot(data.era_exposure.total_planck)} DOT`} />
          <Field
            label="Validator Own Stake"
            value={`${planckToDot(data.era_exposure.own_planck)} DOT`}
          />
          <Field label="Nominators" value={formatNumber(data.era_exposure.nominator_count)} />
        </Section>
      )}
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
    case 'polkadot':
      return <PolkadotChainSections data={cd as unknown as PolkadotChainData} isMobile={isMobile} />;
    default:
      return null;
  }
}
