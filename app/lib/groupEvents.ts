import type { EventListItem, EventGroup } from '@/types/api';

/**
 * Group consecutive events that share the same (event_type, penalty_amount, penalty_token).
 * Events must be pre-sorted by started_at DESC (as from the API).
 */
export function groupConsecutiveEvents(events: EventListItem[]): EventGroup[] {
  if (events.length === 0) return [];

  const groups: EventGroup[] = [];
  let cur: EventGroup = {
    event: events[0]!,
    count: 1,
    eventIds: [events[0]!.id],
    rangeStart: events[0]!.started_at,
    rangeEnd: events[0]!.started_at,
  };

  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1]!;
    const curr = events[i]!;

    if (
      prev.event_type === curr.event_type &&
      prev.penalty_amount === curr.penalty_amount &&
      prev.penalty_token === curr.penalty_token
    ) {
      cur.count += 1;
      cur.eventIds.push(curr.id);
      cur.rangeStart = curr.started_at; // events are DESC, so curr is older
    } else {
      groups.push(cur);
      cur = {
        event: curr,
        count: 1,
        eventIds: [curr.id],
        rangeStart: curr.started_at,
        rangeEnd: curr.started_at,
      };
    }
  }
  groups.push(cur);
  return groups;
}
