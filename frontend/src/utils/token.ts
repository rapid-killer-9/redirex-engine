import type { JwtPayload } from '../types';

const TOKEN_KEY = 'rx_token';

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  decode(): JwtPayload | null {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      if (!t) return null;
      const payload = t.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      // Check expiry
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return decoded as JwtPayload;
    } catch {
      return null;
    }
  },

  isValid(): boolean {
    return this.decode() !== null;
  },
};