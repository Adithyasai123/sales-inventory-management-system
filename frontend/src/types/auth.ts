export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'WAREHOUSE' | 'FINANCE' | string;

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string | null;
  is_system: boolean;
  allowed_screens: string[];
  can_create_orders: boolean;
  can_approve_orders: boolean;
  can_adjust_stock: boolean;
  can_manage_products: boolean;
  can_manage_customers: boolean;
  can_manage_users: boolean;
  can_manage_settings: boolean;
  can_view_audit: boolean;
  users_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleCreatePayload {
  name: string;
  display_name: string;
  description?: string;
  allowed_screens?: string[];
  can_create_orders?: boolean;
  can_approve_orders?: boolean;
  can_adjust_stock?: boolean;
  can_manage_products?: boolean;
  can_manage_customers?: boolean;
  can_manage_users?: boolean;
  can_manage_settings?: boolean;
  can_view_audit?: boolean;
}

export interface RoleUpdatePayload {
  display_name?: string;
  description?: string;
  allowed_screens?: string[];
  can_create_orders?: boolean;
  can_approve_orders?: boolean;
  can_adjust_stock?: boolean;
  can_manage_products?: boolean;
  can_manage_customers?: boolean;
  can_manage_users?: boolean;
  can_manage_settings?: boolean;
  can_view_audit?: boolean;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  role_id?: number | null;
  is_active: boolean;
  is_super_admin?: boolean;
  manager_id?: number | null;
  manager_name?: string | null;
  branch?: string | null;
  direct_reports_count?: number;
  created_by_id?: number | null;
  allowed_screens?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserHierarchyNode {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  branch?: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  manager_id?: number | null;
  manager_name?: string | null;
  direct_reports: UserHierarchyNode[];
  orders_count?: number;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  message: string;
  user?: User;
}

export interface RefreshResponse {
  message: string;
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
  role_id?: number | null;
  is_active?: boolean;
  manager_id?: number | null;
  branch?: string;
  allowed_screens?: string[];
}

export interface UserUpdatePayload {
  email?: string;
  password?: string;
  full_name?: string;
  role?: UserRole;
  role_id?: number | null;
  is_active?: boolean;
  manager_id?: number | null;
  branch?: string;
  allowed_screens?: string[];
}
