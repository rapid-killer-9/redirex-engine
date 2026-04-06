export interface DailyClick {
  day:    string;
  clicks: number;
}

export interface DeviceClick {
  device: string;
  clicks: number;
}

export interface CountryClick {
  country: string;
  clicks:  number;
}

export interface AnalyticsResponse {
  daily:     DailyClick[];
  devices:   DeviceClick[];
  countries: CountryClick[];
}