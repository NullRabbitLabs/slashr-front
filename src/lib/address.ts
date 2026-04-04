import type { NetworkSlug } from '@/types/api';

export function detectNetwork(address: string): NetworkSlug | null {
  if (address.startsWith('cosmos1') || address.startsWith('atom1')) return 'cosmos';
  if (address.startsWith('0x') || address.startsWith('0X')) {
    const hex = address.slice(2);
    if (hex.length === 40 && /^[0-9a-fA-F]+$/.test(hex)) return 'ethereum';
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) return 'sui';
  }
  if (address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
    return 'solana';
  }
  return null;
}

export function detectValidatorAddress(address: string): { network: NetworkSlug } | null {
  if (address.startsWith('cosmosvaloper1')) return { network: 'cosmos' };
  if (address.startsWith('0x') || address.startsWith('0X')) {
    const hex = address.slice(2);
    if (hex.length === 96 && /^[0-9a-fA-F]+$/.test(hex)) return { network: 'ethereum' };
  }
  return null;
}

export function isLikelyPrivateKey(address: string): boolean {
  // Solana private keys are 87-88 char base58
  if (address.length >= 87 && address.length <= 88 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
    return true;
  }
  return false;
}
