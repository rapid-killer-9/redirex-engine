export interface AuthResponse {
  userId: string;
  token:  string;
}

export interface JwtPayload {
  userId: string;
  email:  string;
  exp:    number;
  iat:    number;
}