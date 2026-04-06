export interface UrlRecord {
  id:          string;
  short_key:   string;
  long_url:    string;
  title:       string | null;
  description: string | null;
  click_count: number;
  is_active:   boolean;
  expires_at:  string | null;
  created_at:  string;
  user_id:     string | null;
}

export interface ShortenResponse {
  shortKey: string;
  shortUrl: string;
  userId:   string | null;
}

export interface PaginatedUrls {
  urls:  UrlRecord[];
  total: number;
  page:  number;
  limit: number;
}

export interface ApiError {
  error: string;
}