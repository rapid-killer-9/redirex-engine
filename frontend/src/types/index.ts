// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  userId: string;
  token: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

// ─── URL ─────────────────────────────────────────────────────────────────────

export interface UrlRecord {
  id: string;
  short_key: string;
  long_url: string;
  title: string | null;
  description: string | null;
  click_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  user_id: string | null;
  recent_clicks?: ClickRecord[];
}

export interface ClickRecord {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  referer: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  created_at: string;
}

export interface ShortenResponse {
  shortKey: string;
  shortUrl: string;
  userId: string | null;
}

export interface PaginatedUrls {
  urls: UrlRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface ShortenInput {
  url: string;
  title?: string;
  description?: string;
  expiresAt?: string;
}

export interface UpdateUrlInput {
  isActive?: boolean;
  title?: string;
  description?: string;
  expiresAt?: string | null;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DailyClick {
  day: string;
  clicks: number;
}

export interface DeviceClick {
  device: string;
  clicks: number;
}

export interface CountryClick {
  country: string;
  clicks: number;
}

export interface AnalyticsResponse {
  daily: DailyClick[];
  devices: DeviceClick[];
  countries: CountryClick[];
}

// ─── Router ──────────────────────────────────────────────────────────────────

export type Route = 'home' | 'login' | 'dashboard' | 'detail';

export interface RouteProps {
  navigate: (route: Route, params?: Record<string, string>) => void;
}

export interface AppState {
  route: Route;
  params: Record<string, string>;
}