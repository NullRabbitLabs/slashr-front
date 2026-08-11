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
  renderAtom,
  renderJsonFeed,
  feedWindow,
  FEED_WINDOW_DAYS,
  FEED_MAX_ITEMS,
  INCIDENTS_FEED,
  SLASHING_FEED,
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

// --- WS-D: Atom, and the one curated feed -----------------------------------

test('atom renders a valid-looking feed with self and alternate links', () => {
  const xml = renderAtom(mapEvents([event()] as never), '2026-08-20T09:00:00Z', INCIDENTS_FEED);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
  assert.match(xml, /<link href="[^"]+" rel="self"\/>/);
  assert.match(xml, /<entry>/);
  assert.match(xml, /<id>[^<]+<\/id>/);
});

test('atom dates the feed from the newest entry', () => {
  const items = mapEvents([
    event({ id: 'old', started_at: '2026-08-01T00:00:00.000Z' }),
    event({ id: 'new', started_at: '2026-08-11T14:02:21.000Z' }),
  ] as never);
  const xml = renderAtom(items, '2026-08-20T09:00:00Z', INCIDENTS_FEED);
  assert.match(xml, /<updated>2026-08-11T14:02:21\.000Z<\/updated>/);
});

test('atom escapes XML-hostile characters in titles', () => {
  const [item] = mapEvents([event({ validator_moniker: 'A & B <x>' })] as never);
  const xml = renderAtom([item], '2026-08-20T09:00:00Z', INCIDENTS_FEED);
  assert.ok(!xml.includes('<x>'));
  assert.match(xml, /A &amp; B &lt;x&gt;/);
});

test('atom carries the reuse terms', () => {
  const xml = renderAtom(mapEvents([event()] as never), '2026-08-20T09:00:00Z', INCIDENTS_FEED);
  assert.match(xml, /<rights>[^<]*attribution[^<]*<\/rights>/i);
});

test('the curated feed is a distinct document, not a relabelled firehose', () => {
  const items = mapEvents([event()] as never);
  const firehose = renderRss(items, 'Wed, 20 Aug 2026 09:00:00 GMT', INCIDENTS_FEED);
  const curated = renderRss(items, 'Wed, 20 Aug 2026 09:00:00 GMT', SLASHING_FEED);

  assert.notEqual(INCIDENTS_FEED.rssUrl, SLASHING_FEED.rssUrl);
  assert.ok(curated.includes(SLASHING_FEED.rssUrl), 'self link must point at itself');
  assert.ok(!curated.includes(INCIDENTS_FEED.rssUrl), 'must not self-link to the firehose');
  assert.notEqual(firehose, curated);
});

test('the curated feed asks the API for real penalties only', () => {
  // The filter lives in the feed definition rather than the route, so the
  // query and the title can never drift apart.
  //
  // `slashing=true` resolves against networks.slashes_principal, so the feed
  // cannot contain a chain that has no slashing mechanism; `class=operational`
  // drops commission changes on the chains that do.
  assert.equal(SLASHING_FEED.query, 'slashing=true&class=operational');
});

test('the curated feed may only say "slashing" because it filters on it', () => {
  // The repo terminology rule: never call a Solana/Sui/Avalanche/Near penalty
  // slashing. The title here DOES say slashing, which is only defensible
  // because the query restricts the feed to chains that slash principal. If
  // that filter is ever dropped, this pairing must be revisited.
  assert.ok(SLASHING_FEED.title.toLowerCase().includes('slashing'));
  assert.ok(
    SLASHING_FEED.query.includes('slashing=true'),
    'the slashing claim is only honest while the slashing filter is applied',
  );
});
