import type { NetworkSlug, NetworkTicker, EventType } from '@/types/api';

export interface NetworkMeta {
  ticker: NetworkTicker;
  color: string;
  name: string;
}

export const NETWORK_META: Record<NetworkSlug, NetworkMeta> = {
  solana:    { ticker: 'SOL',  color: '#14F195', name: 'Solana' },
  ethereum:  { ticker: 'ETH',  color: '#849DFF', name: 'Ethereum' },
  cosmos:    { ticker: 'ATOM', color: '#A5A7C4', name: 'Cosmos Hub' },
  sui:       { ticker: 'SUI',  color: '#4DA2FF', name: 'Sui' },
  polkadot:  { ticker: 'DOT',  color: '#E6007A', name: 'Polkadot' },
  celestia:  { ticker: 'TIA',  color: '#7B2BF9', name: 'Celestia' },
  avalanche: { ticker: 'AVAX', color: '#E84142', name: 'Avalanche' },
  near:      { ticker: 'NEAR', color: '#00C08B', name: 'Near' },
};

export const NETWORK_ORDER: readonly NetworkSlug[] = ['solana', 'ethereum', 'cosmos', 'sui', 'polkadot', 'celestia', 'avalanche', 'near'];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  delinquent:          'Went dark. Missed votes.',
  slashed:             'Double-signed a block. Slashed.',
  inactivity_leak:     'Missed attestations during finality delay.',
  slashed_double_sign: 'Signed conflicting blocks at the same height. Tombstoned.',
  slashed_downtime:    'Offline too long. Jailed.',
  tallying_penalty:    'Flagged by peers. Epoch rewards forfeited.',
  duplicate_block:     'Produced duplicate blocks in the same slot.',
  dot_slashed:         'Slashed on-chain. Stake reduced.',
  dot_not_elected:     'Dropped from active validator set.',
  dot_chilled:         'Stopped participating in staking. No stake deducted.',
  commission_increase: 'Raised commission. Delegators earn less.',
  vanilla_solana:      'Running vanilla Solana. MEV tips forfeited.',
  jito_opted_out:      'Stopped running Jito-Solana. Delegators no longer earn MEV tips.',
  jito_opted_in:       'Opted back into Jito-Solana. Delegators earn MEV tips again.',
  tia_slashed_downtime:    'Offline too long on Celestia. Jailed.',
  tia_slashed_double_sign: 'Signed conflicting blocks at the same height on Celestia. Tombstoned.',
  avax_uptime_below_threshold: 'Uptime fell below the Avalanche reward threshold. Stakers earn nothing this period.',
  near_kicked_out:             'Kicked from the Near validator set. Delegators earn nothing this epoch.',
  voluntary_exit:              'Left the validator set. Voluntary exit, not a penalty.',
};

export const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  slashed:             'Validator committed a slashable offense (double signing or conflicting attestation) and is being forcibly ejected. An initial penalty is applied immediately, followed by a 36-day exit period with ongoing losses. A further correlation penalty hits at day 18 - larger when more validators are slashed simultaneously, up to 100% of stake. Delegators earn nothing during the exit period. Principal is at risk.',
  inactivity_leak:     'Validator failed to attest while the chain couldn\'t finalize. Stake is gradually leaked until finality resumes.',
  delinquent:          'Validator stopped participating in consensus and was flagged delinquent by the network. Delegators earn zero rewards for every epoch this persists. There is no automatic recovery - the validator must catch up and resume voting before rewards resume.',
  duplicate_block:     'Validator produced more than one block in the same slot - usually caused by running duplicate validator keys across two machines. Solana\'s on-chain slashing program now records these violations as verifiable proofs. Stake burning is not yet enforced but is under active development.',
  slashed_double_sign: 'Validator signed two different blocks at the same height. A 5% slash is applied to all bonded stake - the validator\'s and all delegators\' proportionally. The validator is permanently tombstoned and cannot rejoin the active set.',
  slashed_downtime:    'Validator missed too many blocks in a row and was jailed. Stake receives a minor slash; validator must manually unjail.',
  tallying_penalty:    'Over two-thirds of validators voted this validator non-performant. All staking rewards for the affected epoch are forfeited - both the validator\'s commission and delegators\' returns. The penalty persists each epoch until enough validators reverse their score. Principal stake is not affected.',
  dot_slashed:         'Validator committed a slashable offense. For equivocation (double signing), the slash starts at 0.01% of bonded stake and scales toward 100% based on how many validators equivocated in the same period. For unresponsiveness, slashing only triggers when more than 10% of validators are simultaneously offline. Nominators share the penalty proportionally.',
  dot_not_elected:     'Validator was not elected to the active set for this era. No rewards will be earned until re-election.',
  dot_chilled:         'Validator stopped participating in Polkadot staking. The chain records that participation stopped but not why, so an operator winding down deliberately and a validator the runtime removed look identical here. Nothing is deducted from stake. Rewards stop until the validator bonds and is elected again.',
  commission_increase: 'Validator raised their commission rate. Every percentage-point increase reduces the share of rewards flowing to delegators. Changes near epoch boundaries are worth extra scrutiny, a pattern some operators use to capture rewards right before delegators can react.',
  vanilla_solana:      'Validator is running the stock Agave client rather than jito-solana, which means they are forfeiting MEV tip revenue that could otherwise flow to their delegators. For validators with meaningful stake this is a direct cost to delegators that does not show up in the advertised commission.',
  jito_opted_out:      'Validator just switched from jito-solana to the stock Agave client, meaning MEV tip revenue that would have flowed to delegators is now being forfeited. A deliberate change, not a technical issue. Worth understanding why.',
  jito_opted_in:       'Validator resumed running jito-solana after a prior opt-out. MEV tip revenue flows to delegators again.',
  tia_slashed_downtime:    'Validator missed too many blocks on Celestia and was jailed. Stake receives a minor slash; validator must manually unjail before they can rejoin consensus. Delegators earn no rewards while jailed.',
  tia_slashed_double_sign: 'Validator signed two different blocks at the same height on Celestia. A slashing penalty is applied to all bonded stake: the validator\'s and all delegators\' proportionally. The validator is permanently tombstoned and cannot rejoin the active set.',
  avax_uptime_below_threshold: 'Validator\'s uptime over its current validation period dropped below the threshold (Avalanche convention is 80%). Validators below the threshold at the end of the period forfeit ALL rewards, for themselves and their delegators, even if their stake remains untouched. Recovers if uptime climbs back above the threshold before the period ends.',
  near_kicked_out:             'Validator was kicked out of the Near active set at the last epoch boundary. Reasons include not producing enough blocks, not validating enough chunks, unstaking, or losing the seat auction. Stake is not slashed, but the validator earns nothing for the kicked epoch and must be re-elected to resume rewards.',
  voluntary_exit:              'Validator initiated a voluntary exit from the Ethereum validator set. This is a normal scheduled departure, not a penalty or misbehaviour. Once the exit is processed the validator stops proposing and attesting, and its stake plus accrued rewards become withdrawable. Worth knowing when a validator you stake with is winding down.',
};

// Mechanism references are now DATA-BACKED: the API carries a class-level
// mechanism reference on each event (migration 078 → slasher.event_types),
// consumed via EventListItem.mechanism. The former hard-coded
// EVENT_TYPE_MECHANISM map was removed so there is one source of truth. The
// methodology page keeps its own editorial MECHANISM_REFS summary table.

export function getEventLabel(eventType: string, penaltyAmount: number | null, penaltyToken: string | null): string {
  let label = EVENT_TYPE_LABELS[eventType as EventType] ?? eventType.replace(/_/g, ' ');
  if (penaltyAmount != null && penaltyToken) {
    label += ` Lost ${penaltyAmount} ${penaltyToken}.`;
  }
  return label;
}

export const COLORS = {
  bg:     'var(--color-bg)',
  text:   'var(--color-text-primary)',
  muted:  'var(--color-text-tertiary)',
  hint:   'var(--color-text-tertiary)',
  red:    'var(--color-danger)',
  border: 'var(--color-border)',
} as const;
