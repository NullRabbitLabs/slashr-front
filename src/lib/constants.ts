import type { NetworkSlug, NetworkTicker, EventType } from '@/types/api';

export interface NetworkMeta {
  ticker: NetworkTicker;
  color: string;
  name: string;
}

export const NETWORK_META: Record<NetworkSlug, NetworkMeta> = {
  solana:   { ticker: 'SOL',  color: '#14F195', name: 'Solana' },
  ethereum: { ticker: 'ETH',  color: '#849DFF', name: 'Ethereum' },
  cosmos:   { ticker: 'ATOM', color: '#A5A7C4', name: 'Cosmos Hub' },
  sui:      { ticker: 'SUI',  color: '#4DA2FF', name: 'Sui' },
  polkadot: { ticker: 'DOT',  color: '#E6007A', name: 'Polkadot' },
};

export const NETWORK_ORDER: readonly NetworkSlug[] = ['solana', 'ethereum', 'cosmos', 'sui', 'polkadot'];

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
};

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
