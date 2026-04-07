import { useState, useCallback } from 'react';

export function useCopy(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeoutMs);
    });
  }, [timeoutMs]);

  return { copied, copy };
}