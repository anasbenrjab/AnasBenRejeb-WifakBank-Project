export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  login: string;
  nom: string;
  prenom: string;
  email: string;
}

export interface UserSummary {
  login: string;
  nom: string;
  prenom: string;
  email: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}
