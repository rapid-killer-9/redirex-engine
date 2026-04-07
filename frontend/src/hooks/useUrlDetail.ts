import { useState, useEffect } from 'react';
import { urlsApi, analyticsApi } from '../api';
import type { UrlRecord, AnalyticsResponse } from '../types';

interface UseUrlDetailReturn {
  url: UrlRecord | null;
  analytics: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUrlDetail(shortKey: string): UseUrlDetailReturn {
  const [url, setUrl] = useState<UrlRecord | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([urlsApi.get(shortKey), analyticsApi.get(shortKey)])
      .then(([urlData, analyticsData]) => {
        if (cancelled) return;
        setUrl(urlData);
        setAnalytics(analyticsData);
      })
      .catch(e => {
        if (cancelled) return;
        setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [shortKey, tick]);

  return { url, analytics, loading, error, refetch };
}