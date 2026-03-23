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
  tallying_penalty:    'Scored low by peer validators.',
  duplicate_block:     'Produced duplicate blocks in the same slot.',
  dot_slashed:         'Slashed on-chain. Stake reduced.',
  dot_not_elected:     'Dropped from active validator set.',
};

export function describeEvent(eventType: EventType, penaltyAmount: number | null, penaltyToken: string | null): string {
  let label = EVENT_TYPE_LABELS[eventType];
  if (penaltyAmount != null && penaltyToken) {
    label += ` Lost ${penaltyAmount} ${penaltyToken}.`;
  }
  return label;
}

export const COLORS = {
  bg:     '#0A0A0B',
  text:   '#E8E6E1',
  muted:  'rgba(255,255,255,0.4)',
  hint:   'rgba(255,255,255,0.4)',
  red:    '#FF4545',
  border: 'rgba(255,255,255,0.06)',
} as const;
