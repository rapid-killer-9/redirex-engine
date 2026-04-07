import { useState, useEffect, useCallback } from 'react';
import { urlsApi } from '../api';
import type { UrlRecord } from '../types';

interface UseUrlsReturn {
  urls: UrlRecord[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  refresh: () => void;
}

export function useUrls(limit = 10): UseUrlsReturn {
  const [urls, setUrls] = useState<UrlRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    urlsApi
      .list(page, limit)
      .then(data => {
        if (cancelled) return;
        setUrls(data.urls);
        setTotal(data.total);
      })
      .catch(e => {
        if (cancelled) return;
        setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, tick]);

  return { urls, total, page, loading, error, setPage, refresh };
}