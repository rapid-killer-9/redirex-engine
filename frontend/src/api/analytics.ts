import { client } from './client';
import type { AnalyticsResponse } from '../types';

export const analyticsApi = {
  get(shortKey: string, days = 30): Promise<AnalyticsResponse> {
    return client.get<AnalyticsResponse>(`/api/urls/${shortKey}/analytics?days=${days}`);
  },
};