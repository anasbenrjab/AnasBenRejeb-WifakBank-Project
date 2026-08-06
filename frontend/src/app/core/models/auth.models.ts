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

export interface SubDepartmentDto {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}

export interface ApplicationDto {
  id: number;
  code: string;
  nom: string;
  description?: string;
  url?: string;
  icon?: string;
  status?: string;
  departmentId?: number | null;
  departmentName?: string | null;
  roleIds?: number[] | null;
  roles?: RoleDto[] | null;
}

export interface RoleDto {
  id: number;
  nom: string;
  description?: string;
}

export interface UserApplicationRoleDto {
  applicationId: number;
  applicationCode: string;
  applicationNom: string;
  roleId: number;
  roleNom: string;
  roleDescription?: string;
}

export interface ApplicationRoleDto {
  applicationId: number;
  applicationCode: string;
  applicationNom: string;
  roleId: number;
  roleNom: string;
  roleDescription?: string;
}

export interface UserDto {
  id: number;
  login: string;
  nom: string;
  prenom: string;
  email: string;
  authType: string;
  status: string;
  department?: DepartmentDto | null;
  subDepartment?: SubDepartmentDto | null;
  applicationRoles?: UserApplicationRoleDto[];
  applicationId?: number | null;
  roleId?: number | null;
  roles?: RoleDto[];
  applicationRoleApplicationIds?: number[];
  applicationRoleRoleIds?: number[];
  subDepartmentId?: number | null;
  createdAt?: string | null;
  lastLogin?: string | null;
  password?: string;
}

export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}
