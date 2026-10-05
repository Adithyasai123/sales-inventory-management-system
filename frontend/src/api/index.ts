import { apiClient } from '../lib/axios';
import { PaginatedResponse, MessageResponse } from '../types';
import { User, Tokens, LoginPayload } from '../types/auth';
import { Customer, CustomerInput } from '../types/customer';
import { Product, ProductInput, StockAdjustPayload } from '../types/product';
import { SalesOrder, OrderDetail, CreateOrderPayload, OrderStatus } from '../types/order';
import { ApprovalActionPayload } from '../types/approval';
import { InventoryMovement, LowStockAlert, MovementType } from '../types/inventory';
import { DashboardSummary } from '../types/dashboard';
import { SystemSetting, ThresholdUpdatePayload } from '../types/setting';

export const authApi = {
  login: async (payload: LoginPayload): Promise<Tokens> => {
    const { data } = await apiClient.post<Tokens>('/auth/login', payload);
    return data;
  },
  refresh: async (refreshToken: string): Promise<Tokens> => {
    const { data } = await apiClient.post<Tokens>('/auth/refresh', { refresh_token: refreshToken });
    return data;
  },
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
};

export const usersApi = {
  list: async (params?: { page?: number; page_size?: number; role?: string; search?: string }): Promise<PaginatedResponse<User>> => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/users', { params });
    return data;
  },
  create: async (payload: any): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },
  get: async (id: number): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },
  update: async (id: number, payload: any): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<MessageResponse> => {
    const { data } = await apiClient.delete<MessageResponse>(`/users/${id}`);
    return data;
  },
};

export const customersApi = {
  list: async (params?: { page?: number; page_size?: number; search?: string; is_active?: boolean; sort_by?: string; sort_order?: string }): Promise<PaginatedResponse<Customer>> => {
    const { data } = await apiClient.get<PaginatedResponse<Customer>>('/customers', { params });
    return data;
  },
  create: async (payload: CustomerInput): Promise<Customer> => {
    const { data } = await apiClient.post<Customer>('/customers', payload);
    return data;
  },
  get: async (id: number): Promise<Customer> => {
    const { data } = await apiClient.get<Customer>(`/customers/${id}`);
    return data;
  },
  update: async (id: number, payload: Partial<CustomerInput>): Promise<Customer> => {
    const { data } = await apiClient.put<Customer>(`/customers/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<MessageResponse> => {
    const { data } = await apiClient.delete<MessageResponse>(`/customers/${id}`);
    return data;
  },
};

export const productsApi = {
  list: async (params?: { page?: number; page_size?: number; search?: string; category?: string; is_low_stock?: boolean; is_active?: boolean; sort_by?: string; sort_order?: string }): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
    return data;
  },
  create: async (payload: ProductInput): Promise<Product> => {
    const { data } = await apiClient.post<Product>('/products', payload);
    return data;
  },
  get: async (id: number): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/products/${id}`);
    return data;
  },
  update: async (id: number, payload: Partial<ProductInput>): Promise<Product> => {
    const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<MessageResponse> => {
    const { data } = await apiClient.delete<MessageResponse>(`/products/${id}`);
    return data;
  },
  adjustStock: async (id: number, payload: StockAdjustPayload): Promise<Product> => {
    const { data } = await apiClient.post<Product>(`/products/${id}/adjust-stock`, payload);
    return data;
  },
};

export const ordersApi = {
  list: async (params?: { page?: number; page_size?: number; status?: OrderStatus; customer_id?: number; search?: string; sort_by?: string; sort_order?: string }): Promise<PaginatedResponse<SalesOrder>> => {
    const { data } = await apiClient.get<PaginatedResponse<SalesOrder>>('/orders', { params });
    return data;
  },
  create: async (payload: CreateOrderPayload): Promise<OrderDetail> => {
    const { data } = await apiClient.post<OrderDetail>('/orders', payload);
    return data;
  },
  get: async (id: number): Promise<OrderDetail> => {
    const { data } = await apiClient.get<OrderDetail>(`/orders/${id}`);
    return data;
  },
  cancel: async (id: number): Promise<OrderDetail> => {
    const { data } = await apiClient.post<OrderDetail>(`/orders/${id}/cancel`);
    return data;
  },
};

export const approvalsApi = {
  listPending: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<SalesOrder>> => {
    const { data } = await apiClient.get<PaginatedResponse<SalesOrder>>('/approvals/pending', { params });
    return data;
  },
  submitAction: async (id: number, payload: ApprovalActionPayload): Promise<OrderDetail> => {
    const { data } = await apiClient.post<OrderDetail>(`/approvals/${id}/action`, payload);
    return data;
  },
};

export const inventoryApi = {
  listMovements: async (params?: { page?: number; page_size?: number; product_id?: number; movement_type?: MovementType }): Promise<PaginatedResponse<InventoryMovement>> => {
    const { data } = await apiClient.get<PaginatedResponse<InventoryMovement>>('/inventory/movements', { params });
    return data;
  },
  getLowStockAlerts: async (): Promise<LowStockAlert[]> => {
    const { data } = await apiClient.get<LowStockAlert[]>('/inventory/low-stock');
    return data;
  },
};

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return data;
  },
};

export const settingsApi = {
  getAll: async (): Promise<SystemSetting[]> => {
    const { data } = await apiClient.get<SystemSetting[]>('/settings');
    return data;
  },
  updateThreshold: async (payload: ThresholdUpdatePayload): Promise<SystemSetting> => {
    const { data } = await apiClient.put<SystemSetting>('/settings/threshold', payload);
    return data;
  },
  updateKey: async (key: string, value: string): Promise<SystemSetting> => {
    const { data } = await apiClient.put<SystemSetting>(`/settings/${key}`, { value });
    return data;
  },
};
