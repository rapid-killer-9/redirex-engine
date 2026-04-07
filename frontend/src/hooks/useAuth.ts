import { useState, useCallback } from 'react';
import { authApi } from '../api';
import { tokenStorage } from '../utils/token';
import type { JwtPayload } from '../types';

export function useAuth() {
  const [user, setUser] = useState<JwtPayload | null>(() => tokenStorage.decode());

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const { token } = await authApi.login(email, password);
    tokenStorage.set(token);
    setUser(tokenStorage.decode());
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    const { token } = await authApi.register(email, password);
    tokenStorage.set(token);
    setUser(tokenStorage.decode());
  }, []);

  const logout = useCallback((): void => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  return { user, login, register, logout, isAuthenticated: user !== null };
}