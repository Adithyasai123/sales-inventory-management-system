export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_super_admin?: boolean;
  manager_id?: number | null;
  created_by_id?: number | null;
  allowed_screens?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserCreatePayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  is_active?: boolean;
  manager_id?: number | null;
  allowed_screens?: string[];
}

export interface UserUpdatePayload {
  email?: string;
  password?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  manager_id?: number | null;
  allowed_screens?: string[];
}
