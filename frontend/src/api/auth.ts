import { client } from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  register(email: string, password: string): Promise<AuthResponse> {
    return client.post<AuthResponse>('/api/auth/register', { email, password }, { skipAuth: true });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return client.post<AuthResponse>('/api/auth/login', { email, password }, { skipAuth: true });
  },
};