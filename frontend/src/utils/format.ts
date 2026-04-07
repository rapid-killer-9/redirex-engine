export const fmt = {
  date(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  datetime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  number(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  },

  truncate(str: string, max: number): string {
    if (str.length <= max) return str;
    return str.slice(0, max) + '…';
  },

  shortUrl(shortKey: string): string {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    return `${base}/${shortKey}`;
  },
};