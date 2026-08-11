// TDD for the story feed (WS-C, plans/BLOCKTHREAT-FEEDS-PLAN.md).
// Run with:  node --test app/lib/feedStories.test.ts
//
// This feed exists to fix defect 3 in the plan: one item per EPISODE, not one
// per validator. A correlated 40-validator outage is one story that grows, not
// forty items that flood a reader's inbox.
//
// It is deliberately quiet. The incident layer produces roughly two episodes a
// month, so this feed is not the one we pitch — it is the one that is correct
// when something actually happens.
//
// Two repo rules are load-bearing here and are pinned by tests:
//   * detector kinds are internal codes and are NEVER rendered raw
//   * a duration measures to the OBSERVED end, never to when our sweep noticed

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapIncidents, STORIES_FEED } from './feedStories.ts';
import { renderRss, renderAtom } from './feedIncidents.ts';

const incident = (over: Record<string, unknown> = {}) => ({
  slug: 'solana-outage-20260728-1402',
  kind: 'mass_down_burst',
  chain: 'solana',
  status: 'resolved',
  started_at: '2026-07-28T14:02:00.000Z',
  resolved_at: '2026-07-28T15:32:00.000Z',
  duration_seconds: 5400,
  current_magnitude: 0,
  peak_magnitude: 43,
  ...over,
});

test('one item per episode, whatever its size', () => {
  const items = mapIncidents([incident({ peak_magnitude: 43 })] as never);
  assert.equal(items.length, 1, 'a 43-validator outage is one story');
});

test('the link is the incident permalink, not a validator page', () => {
  const [item] = mapIncidents([incident()] as never);
  assert.equal(item.url, 'https://slashr.dev/incident/solana-outage-20260728-1402');
});

test('detector kinds are never rendered raw', () => {
  const [item] = mapIncidents([incident({ kind: 'mass_down_burst' })] as never);
  const text = `${item.title} ${item.description}`;
  assert.ok(!text.includes('mass_down_burst'), `raw code leaked: ${text}`);
  assert.match(item.title, /Correlated outage/);
});

test('an unknown detector kind degrades to a safe label', () => {
  const [item] = mapIncidents([incident({ kind: 'brand_new_detector' })] as never);
  const text = `${item.title} ${item.description}`;
  assert.ok(!text.includes('brand_new_detector'), `raw code leaked: ${text}`);
  assert.match(text, /Incident/);
});

test('the headline carries the scale, which is the whole point of an episode', () => {
  const [item] = mapIncidents([incident({ peak_magnitude: 43 })] as never);
  assert.match(item.description, /43/);
});

test('a resolved episode reports duration to the observed end', () => {
  // 5400s = 1h 30m, measured first-event to observed recovery. It must NOT be
  // recomputed from "now" or from when our sweep noticed.
  const [item] = mapIncidents([incident({ duration_seconds: 5400 })] as never);
  assert.match(item.description, /1h 30m/);
});

test('an ongoing episode says so instead of inventing a duration', () => {
  const [item] = mapIncidents([
    incident({ status: 'active', resolved_at: null, duration_seconds: null }),
  ] as never);
  assert.match(item.description, /Ongoing/i);
  assert.ok(!/\d+h \d+m/.test(item.description), `invented a duration: ${item.description}`);
});

test('a retracted episode reads as a correction, not a shrug', () => {
  const [item] = mapIncidents([
    incident({ status: 'retracted', resolved_at: null, duration_seconds: null }),
  ] as never);
  assert.match(item.description, /unconfirmed/i);
});

test('a chainless episode does not render the word null', () => {
  const [item] = mapIncidents([incident({ chain: null })] as never);
  const text = `${item.title} ${item.description}`;
  assert.ok(!text.toLowerCase().includes('null'), `got: ${text}`);
});

test('items render into both envelopes without leaking markup', () => {
  const items = mapIncidents([incident()] as never);
  const rss = renderRss(items, 'Wed, 20 Aug 2026 09:00:00 GMT', STORIES_FEED);
  const atom = renderAtom(items, '2026-08-20T09:00:00Z', STORIES_FEED);

  assert.ok(rss.includes(STORIES_FEED.rssUrl));
  assert.ok(atom.includes(STORIES_FEED.atomUrl));
  assert.match(rss, /<item>/);
  assert.match(atom, /<entry>/);
});

test('an empty incident list still produces a valid document', () => {
  // The expected steady state: this feed is quiet by design.
  const rss = renderRss(mapIncidents([]), 'Wed, 20 Aug 2026 09:00:00 GMT', STORIES_FEED);
  assert.match(rss, /<\/channel>\n<\/rss>$/);
  assert.ok(!rss.includes('<item>'));
});
