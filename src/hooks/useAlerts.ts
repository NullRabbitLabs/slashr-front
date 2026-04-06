import { useState, useCallback, useEffect } from 'react';
import type {
  NetworkSlug,
  SubscribeAlertResponse,
  VerifyAlertResponse,
  UnsubscribeInfoResponse,
  UnsubscribeConfirmResponse,
  ManageAlertsResponse,
  AlertSubscription,
} from '@/types/api';
import {
  subscribeAlert,
  verifyAlert,
  fetchUnsubscribeInfo,
  confirmUnsubscribe,
  fetchAlertSubscriptions,
} from '@/api/client';

export function useSubscribe() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SubscribeAlertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (email: string, targetAddress: string, chain?: NetworkSlug) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await subscribeAlert(email, targetAddress, chain);
      setSuccess(res.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSuccess(null);
    setError(null);
    setLoading(false);
  }, []);

  return { submit, loading, success, error, reset };
}

export function useVerify(token: string | null) {
  const [data, setData] = useState<VerifyAlertResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    verifyAlert(token)
      .then(res => {
        if (!cancelled) setData(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  return { data, loading, error };
}

export function useUnsubscribe(token: string | null) {
  const [info, setInfo] = useState<UnsubscribeInfoResponse | null>(null);
  const [confirmed, setConfirmed] = useState<UnsubscribeConfirmResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No unsubscribe token provided.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchUnsubscribeInfo(token)
      .then(res => {
        if (!cancelled) setInfo(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  const confirm = useCallback(async () => {
    if (!token) return;
    setConfirming(true);
    setError(null);

    try {
      const res = await confirmUnsubscribe(token);
      setConfirmed(res.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConfirming(false);
    }
  }, [token]);

  return { info, confirmed, loading, confirming, error, confirm };
}

export function useManageSubscriptions(token: string | null) {
  const [data, setData] = useState<ManageAlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No management token provided.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAlertSubscriptions(token)
      .then(res => {
        if (!cancelled) setData(res.data);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  const remove = useCallback(async (subscription: AlertSubscription) => {
    setRemovingId(subscription.id);
    try {
      await confirmUnsubscribe(subscription.id);
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          subscriptions: prev.subscriptions.filter(s => s.id !== subscription.id),
        };
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRemovingId(null);
    }
  }, []);

  return { data, loading, error, removingId, remove };
}
