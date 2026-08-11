// TDD for the machine-readable incident feeds (WS-B, feed integrity).
// Run with:  node --test app/lib/feedIncidents.test.ts
// (Node's native TS type-stripping; no test-runner dependency added to the
// deliberately-minimal frontend.)
//
// What these lock down, and why each one is here:
//   * a "~$0 estimated loss" never reaches a reader (it read as sloppy on the
//     live feed, and most Cosmos-family jailings carry no measurable loss)
//   * every item has a stable per-event anchor, so a feed reader lands ON the
//     event rather than at the top of a validator page
//   * lastBuildDate reflects the newest item, not the moment of the request, so
//     conditional GETs can actually short-circuit
//   * the window is time-floored, so a weekly reader cannot silently miss days

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapEvents,
  renderRss,
  renderJsonFeed,
  feedWindow,
  FEED_WINDOW_DAYS,
  FEED_MAX_ITEMS,
} from './feedIncidents.ts';

const event = (over: Record<string, unknown> = {}) => ({
  id: 'abc-123',
  network: 'cosmos',
  validator_address: 'cosmosvaloper1v78qrdl7680h7rv007rd7aq6dmx9xf9de63egw',
  validator_moniker: 'BitHome',
  event_type: 'slashed_downtime',
  severity: 'warning',
  started_at: '2026-08-11T14:02:21.000Z',
  resolved_at: '2026-08-11T15:02:21.000Z',
  penalty_amount: null,
  penalty_token: null,
  estimated_loss_usd: null,
  ...over,
});

test('zero estimated loss is omitted, never rendered as "~$0"', () => {
  const [item] = mapEvents([event({ estimated_loss_usd: 0 })] as never);
  assert.ok(!item.description.includes('$0'), `got: ${item.description}`);
  assert.ok(!item.description.toLowerCase().includes('estimated loss'));
});

test('null estimated loss is omitted', () => {
  const [item] = mapEvents([event({ estimated_loss_usd: null })] as never);
  assert.ok(!item.description.toLowerCase().includes('estimated loss'));
});

test('a sub-dollar loss that would ROUND to $0 is omitted too', () => {
  // Caught against live data: guarding on `> 0` is not enough, because the
  // renderer rounds. A 40-cent loss printed as "~$0 estimated loss".
  for (const loss of [0.0001, 0.4, 0.49]) {
    const [item] = mapEvents([event({ estimated_loss_usd: loss })] as never);
    assert.ok(
      !item.description.includes('$0'),
      `loss ${loss} rendered as: ${item.description}`,
    );
  }
});

test('a real estimated loss is still reported', () => {
  const [item] = mapEvents([event({ estimated_loss_usd: 45592.44 })] as never);
  assert.match(item.description, /~\$45,592 estimated loss\./);
});

test('a zero penalty amount is omitted rather than "Lost 0"', () => {
  const [item] = mapEvents([
    event({ penalty_amount: 0, penalty_token: 'ATOM' }),
  ] as never);
  assert.ok(!item.description.includes('Lost 0'), `got: ${item.description}`);
});

test('a real penalty amount is still reported', () => {
  const [item] = mapEvents([
    event({ penalty_amount: 1.25, penalty_token: 'ATOM' }),
  ] as never);
  assert.match(item.description, /Lost 1\.25 ATOM\./);
});

test('each item carries a stable per-event anchor', () => {
  const [item] = mapEvents([event()] as never);
  assert.ok(
    item.url.endsWith('#event-abc-123'),
    `expected a #event- anchor, got: ${item.url}`,
  );
  assert.ok(item.url.includes('/validator/cosmos/'));
});

test('lastBuildDate comes from the newest item, not the request clock', () => {
  const items = mapEvents([
    event({ id: 'old', started_at: '2026-08-01T00:00:00.000Z' }),
    event({ id: 'new', started_at: '2026-08-11T14:02:21.000Z' }),
  ] as never);
  const xml = renderRss(items, 'Wed, 20 Aug 2026 09:00:00 GMT');
  assert.match(xml, /<lastBuildDate>Tue, 11 Aug 2026 14:02:21 GMT<\/lastBuildDate>/);
});

test('an empty feed falls back to the request clock for lastBuildDate', () => {
  const xml = renderRss([], 'Wed, 20 Aug 2026 09:00:00 GMT');
  assert.match(xml, /<lastBuildDate>Wed, 20 Aug 2026 09:00:00 GMT<\/lastBuildDate>/);
});

test('the channel states reuse terms so a curator knows it may quote us', () => {
  const xml = renderRss(mapEvents([event()] as never), 'Wed, 20 Aug 2026 09:00:00 GMT');
  assert.match(xml, /<copyright>[^<]*attribution[^<]*<\/copyright>/i);
});

test('the JSON feed carries the same reuse terms', () => {
  const feed = renderJsonFeed(mapEvents([event()] as never)) as Record<string, unknown>;
  assert.match(String(feed.user_comment ?? ''), /attribution/i);
});

test('the request window is time-floored to a week, not a bare row count', () => {
  const w = feedWindow(new Date('2026-08-11T14:00:00.000Z'));
  assert.equal(w.limit, FEED_MAX_ITEMS);
  assert.equal(FEED_WINDOW_DAYS, 7);
  assert.equal(w.from, '2026-08-04T14:00:00.000Z');
});

test('XML-hostile characters in a moniker cannot break the document', () => {
  const [item] = mapEvents([
    event({ validator_moniker: 'A & B <staking> "co"' }),
  ] as never);
  const xml = renderRss([item], 'Wed, 20 Aug 2026 09:00:00 GMT');
  assert.ok(!xml.includes('<staking>'));
  assert.match(xml, /A &amp; B &lt;staking&gt;/);
});
