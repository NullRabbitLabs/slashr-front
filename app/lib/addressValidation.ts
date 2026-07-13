import type { NetworkSlug } from '@/types/api';

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

export function detectNetwork(address: string): NetworkSlug | null {
  if (address.startsWith('cosmos1') || address.startsWith('atom1')) return 'cosmos';
  if (address.startsWith('0x') || address.startsWith('0X')) {
    const hex = address.slice(2);
    if (hex.length === 40 && /^[0-9a-fA-F]+$/.test(hex)) return 'ethereum';
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) return 'sui';
  }
  if (address.length >= 32 && address.length <= 44 && BASE58_RE.test(address)) {
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

export function looksLikePrivateKey(input: string): boolean {
  return (input.length === 87 || input.length === 88) && BASE58_RE.test(input);
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string; isPrivateKey?: boolean };

const PRIVATE_KEY_ERROR =
  'That looks like a private key. Never paste private keys anywhere. This field expects a wallet address.';
const INVALID_ADDRESS_ERROR =
  "That doesn't look like a valid wallet address.";

const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ETHEREUM_RE = /^0[xX][0-9a-fA-F]{40}$/;
const SUI_RE = /^0[xX][0-9a-fA-F]{64}$/;
const COSMOS_RE = /^cosmos1[a-z0-9]{32,58}$/;

export function validateWalletAddress(input: string): ValidationResult {
  if (looksLikePrivateKey(input)) {
    return { valid: false, error: PRIVATE_KEY_ERROR, isPrivateKey: true };
  }

  if (
    SOLANA_RE.test(input) ||
    ETHEREUM_RE.test(input) ||
    SUI_RE.test(input) ||
    COSMOS_RE.test(input)
  ) {
    return { valid: true };
  }

  return { valid: false, error: INVALID_ADDRESS_ERROR };
}
