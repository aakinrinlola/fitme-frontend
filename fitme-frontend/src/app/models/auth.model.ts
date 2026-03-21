export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  fitnessLevel?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  fitnessLevel: string;
  age: number;
  weightKg: number;
  heightCm: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: UserInfo;
}
