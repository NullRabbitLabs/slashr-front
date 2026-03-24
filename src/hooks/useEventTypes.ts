import { useState, useEffect, useMemo } from 'react';
import type { EventTypeInfo } from '@/types/api';
import { fetchEventTypes } from '@/api/client';
import { EVENT_TYPE_LABELS } from '@/lib/constants';

export type EventTypeLookup = Map<string, EventTypeInfo>;

export function useEventTypes() {
  const [eventTypes, setEventTypes] = useState<EventTypeInfo[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchEventTypes()
      .then(res => {
        if (!cancelled) setEventTypes(res.data);
      })
      .catch(() => {
        // Silently fall back to hardcoded labels
      });
    return () => { cancelled = true; };
  }, []);

  const lookup = useMemo(() => {
    const map = new Map<string, EventTypeInfo>();
    for (const et of eventTypes) {
      map.set(et.code, et);
    }
    return map;
  }, [eventTypes]);

  return { eventTypes, lookup };
}

/** Get the label for an event type, with fallback to hardcoded constants then raw code. */
export function getEventLabel(
  lookup: EventTypeLookup,
  eventType: string,
  penaltyAmount: number | null,
  penaltyToken: string | null,
): string {
  const info = lookup.get(eventType);
  let label = info?.label
    ?? EVENT_TYPE_LABELS[eventType as keyof typeof EVENT_TYPE_LABELS]
    ?? eventType.replace(/_/g, ' ');
  if (penaltyAmount != null && penaltyToken) {
    label += ` Lost ${penaltyAmount} ${penaltyToken}.`;
  }
  return label;
}
