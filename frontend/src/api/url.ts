import { client } from './client';
import type {
  ShortenInput,
  ShortenResponse,
  PaginatedUrls,
  UrlRecord,
  UpdateUrlInput,
} from '../types';

export const urlsApi = {
  shorten(input: ShortenInput): Promise<ShortenResponse> {
    return client.post<ShortenResponse>('/api/shorten', input);
  },

  list(page = 1, limit = 10): Promise<PaginatedUrls> {
    return client.get<PaginatedUrls>(`/api/urls?page=${page}&limit=${limit}`);
  },

  get(shortKey: string): Promise<UrlRecord> {
    return client.get<UrlRecord>(`/api/urls/${shortKey}`);
  },

  update(shortKey: string, input: UpdateUrlInput): Promise<UrlRecord> {
    return client.patch<UrlRecord>(`/api/urls/${shortKey}`, input);
  },

  delete(shortKey: string): Promise<void> {
    return client.delete<void>(`/api/urls/${shortKey}`);
  },
};