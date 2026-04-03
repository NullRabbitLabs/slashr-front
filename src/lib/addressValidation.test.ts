import {
  detectNetwork,
  detectValidatorAddress,
  looksLikePrivateKey,
  validateWalletAddress,
} from './addressValidation';

describe('detectNetwork', () => {
  it('detects Cosmos (cosmos1 prefix)', () => {
    expect(detectNetwork('cosmos1clpqr4nrk4khgkxj78fcwwh6dl3ual4tzqj2l')).toBe('cosmos');
  });

  it('detects Cosmos (atom1 prefix)', () => {
    expect(detectNetwork('atom1abcdefghij1234567890abcdefghij1234567890')).toBe('cosmos');
  });

  it('detects Ethereum (0x + 40 hex)', () => {
    expect(detectNetwork('0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326')).toBe('ethereum');
  });

  it('detects Ethereum case-insensitive 0X prefix', () => {
    expect(detectNetwork('0X1f9090aaE28b8a3dCeaDf281B0F12828e676c326')).toBe('ethereum');
  });

  it('detects Sui (0x + 64 hex)', () => {
    expect(detectNetwork('0x4e7f1babd71970308e00b2cccb5e5ec795241965c07e82a48eaee4a3831fdb5c')).toBe('sui');
  });

  it('detects Solana (base58, 32-44 chars)', () => {
    expect(detectNetwork('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe('solana');
  });

  it('detects Solana at minimum length (32 chars)', () => {
    const addr = '1A2B3C4D5E6F7G8H9JKLMNPQRSTUVWxy';
    expect(addr.length).toBe(32);
    expect(detectNetwork(addr)).toBe('solana');
  });

  it('returns null for short input', () => {
    expect(detectNetwork('abc')).toBeNull();
  });

  it('returns null for gibberish', () => {
    expect(detectNetwork('hello world this is not an address')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(detectNetwork('')).toBeNull();
  });
});

describe('detectValidatorAddress', () => {
  it('detects Cosmos validator (cosmosvaloper1)', () => {
    const result = detectValidatorAddress('cosmosvaloper1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u2lcnj0');
    expect(result).toEqual({ network: 'cosmos' });
  });

  it('detects Ethereum validator (0x + 96 hex)', () => {
    const pubkey = '0x' + 'a'.repeat(96);
    const result = detectValidatorAddress(pubkey);
    expect(result).toEqual({ network: 'ethereum' });
  });

  it('returns null for regular wallet addresses', () => {
    expect(detectValidatorAddress('0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(detectValidatorAddress('')).toBeNull();
  });
});

describe('looksLikePrivateKey', () => {
  it('returns true for 88-char base58 string', () => {
    const key = '5'.repeat(88);
    expect(looksLikePrivateKey(key)).toBe(true);
  });

  it('returns true for 87-char base58 string', () => {
    const key = 'A'.repeat(87);
    expect(looksLikePrivateKey(key)).toBe(true);
  });

  it('returns false for 86-char base58 string', () => {
    expect(looksLikePrivateKey('A'.repeat(86))).toBe(false);
  });

  it('returns false for 89-char base58 string', () => {
    expect(looksLikePrivateKey('A'.repeat(89))).toBe(false);
  });

  it('returns false when string contains invalid base58 chars (0, O, I, l)', () => {
    const withZero = '0' + '5'.repeat(87);
    expect(looksLikePrivateKey(withZero)).toBe(false);

    const withO = 'O' + '5'.repeat(87);
    expect(looksLikePrivateKey(withO)).toBe(false);

    const withI = 'I' + '5'.repeat(87);
    expect(looksLikePrivateKey(withI)).toBe(false);

    const withl = 'l' + '5'.repeat(87);
    expect(looksLikePrivateKey(withl)).toBe(false);
  });

  it('returns false for normal Solana address (44 chars)', () => {
    expect(looksLikePrivateKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(looksLikePrivateKey('')).toBe(false);
  });
});

describe('validateWalletAddress', () => {
  it('accepts valid Solana address', () => {
    const result = validateWalletAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
    expect(result).toEqual({ valid: true });
  });

  it('accepts valid Ethereum address', () => {
    const result = validateWalletAddress('0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326');
    expect(result).toEqual({ valid: true });
  });

  it('accepts valid Sui address', () => {
    const result = validateWalletAddress('0x4e7f1babd71970308e00b2cccb5e5ec795241965c07e82a48eaee4a3831fdb5c');
    expect(result).toEqual({ valid: true });
  });

  it('accepts valid Cosmos address', () => {
    const result = validateWalletAddress('cosmos1clpqr4nrk4khgkxj78fcwwh6dl3ual4tzqj2l');
    expect(result).toEqual({ valid: true });
  });

  it('rejects garbage input', () => {
    const result = validateWalletAddress('hello world');
    expect(result).toEqual({
      valid: false,
      error: "That doesn't look like a valid wallet address.",
    });
  });

  it('rejects partial hex address', () => {
    const result = validateWalletAddress('0x123');
    expect(result).toEqual({
      valid: false,
      error: "That doesn't look like a valid wallet address.",
    });
  });

  it('rejects empty string', () => {
    const result = validateWalletAddress('');
    expect(result).toEqual({
      valid: false,
      error: "That doesn't look like a valid wallet address.",
    });
  });

  it('detects private key (88-char base58)', () => {
    const key = '5'.repeat(88);
    const result = validateWalletAddress(key);
    expect(result).toEqual({
      valid: false,
      error: 'That looks like a private key. Never paste private keys anywhere. This field expects a wallet address.',
      isPrivateKey: true,
    });
  });

  it('detects private key (87-char base58)', () => {
    const key = 'A'.repeat(87);
    const result = validateWalletAddress(key);
    expect(result).toEqual({
      valid: false,
      error: 'That looks like a private key. Never paste private keys anywhere. This field expects a wallet address.',
      isPrivateKey: true,
    });
  });

  it('private key check takes priority over format validation', () => {
    // 88-char base58 would fail format validation anyway, but private key error should come first
    const key = '5'.repeat(88);
    const result = validateWalletAddress(key);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.isPrivateKey).toBe(true);
    }
  });
});
