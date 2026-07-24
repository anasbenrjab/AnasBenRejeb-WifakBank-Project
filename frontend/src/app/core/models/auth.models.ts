export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  login: string;
  nom?: string;
  prenom?: string;
  email: string;
  otpRequired?: boolean;
  admin?: boolean;
}

export interface VerifyOtpRequest {
  login: string;
  code: string;
}

export interface ResendOtpRequest {
  login: string;
}

export interface UserSummary {
  login: string;
  nom: string;
  prenom: string;
  email: string;
  admin?: boolean;
}

export interface DepartmentDto {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface ApplicationDto {
  id: number;
  code: string;
  nom: string;
  description?: string;
  url?: string;
  icon?: string;
  status?: string;
}

export interface RoleDto {
  id: number;
  nom: string;
  description?: string;
}

export interface UserDto {
  id: number;
  login: string;
  nom: string;
  prenom: string;
  email: string;
  authType: string;
  status: string;
  department?: DepartmentDto;
  roles?: RoleDto[];
  password?: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}
