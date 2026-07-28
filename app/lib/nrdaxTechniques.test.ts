// TDD for the pure NRDAX-technique collector used by the risk detail.
// Run with:  node --test app/lib/nrdaxTechniques.test.ts
// (Node's native TS type-stripping; no test-runner dependency added to the
// deliberately-minimal frontend.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectNrdaxTechniques, nrdaxBadge } from './nrdaxTechniques.ts';

const link = (id: string) => ({ id, url: `https://nrdax.com/techniques/${id}`, basis: `basis for ${id}` });
const signal = (s: string, techniques: Array<ReturnType<typeof link>>) => ({
  signal: s,
  kind: s.split(':')[0],
  code: s.split(':')[1] ?? s,
  label: s,
  count: 1,
  techniques,
});

test('no signals → no techniques', () => {
  assert.deepEqual(collectNrdaxTechniques([]), []);
});

test('unmapped signals (no techniques) → no technique links', () => {
  const signals = [signal('event_type:slashed', []), signal('scan:has_cve', [])];
  assert.deepEqual(collectNrdaxTechniques(signals), []);
});

test('a mapped signal surfaces its technique links, sorted by id', () => {
  const signals = [signal('scan:exposed_rpc', [link('NRDAX-T0002'), link('NRDAX-T0001')])];
  const out = collectNrdaxTechniques(signals);
  assert.deepEqual(out.map((t) => t.id), ['NRDAX-T0001', 'NRDAX-T0002']);
  assert.equal(out[0].url, 'https://nrdax.com/techniques/NRDAX-T0001');
  assert.ok(out[0].basis.length > 0);
});

test('a technique reached via two signals is de-duplicated', () => {
  const signals = [
    signal('scan:exposed_rpc', [link('NRDAX-T0001')]),
    signal('event_type:foo', [link('NRDAX-T0001'), link('NRDAX-T0009')]),
  ];
  const out = collectNrdaxTechniques(signals);
  assert.deepEqual(out.map((t) => t.id), ['NRDAX-T0001', 'NRDAX-T0009']);
});

test('is null/undefined tolerant (degrades to empty)', () => {
  // @ts-expect-error exercising the runtime guard
  assert.deepEqual(collectNrdaxTechniques(undefined), []);
  // @ts-expect-error a signal missing its techniques array
  assert.deepEqual(collectNrdaxTechniques([{ signal: 'x' }]), []);
});

const UTM = 'utm_source=slashr.dev&utm_medium=validator-profile&utm_campaign=nrdax-join';

test('nrdaxBadge builds the badge src + a utm-tagged technique link', () => {
  const b = nrdaxBadge(
    { id: 'NRDAX-T0001', url: 'https://nrdax.com/techniques/NRDAX-T0001', basis: 'x' },
    'validator-profile',
  );
  assert.equal(b.href, `https://nrdax.com/techniques/NRDAX-T0001?${UTM}`);
  assert.equal(b.badgeSrc, `https://nrdax.com/badge/NRDAX-T0001.svg?${UTM}`);
  assert.equal(b.alt, 'NRDAX-T0001 in the NRDAX registry');
});

test('nrdaxBadge derives the badge origin from the technique url + varies medium', () => {
  const b = nrdaxBadge(
    { id: 'NRDAX-T0002', url: 'https://staging.nrdax.com/techniques/NRDAX-T0002', basis: 'x' },
    'risk-drawer',
  );
  assert.ok(b.badgeSrc.startsWith('https://staging.nrdax.com/badge/NRDAX-T0002.svg?'));
  assert.ok(b.badgeSrc.includes('utm_medium=risk-drawer'));
  assert.ok(b.href.includes('utm_medium=risk-drawer'));
});

test('nrdaxBadge falls back to nrdax.com origin on a malformed url', () => {
  const b = nrdaxBadge({ id: 'NRDAX-T0003', url: 'not a url', basis: 'x' }, 'x');
  assert.ok(b.badgeSrc.startsWith('https://nrdax.com/badge/NRDAX-T0003.svg?'));
});
