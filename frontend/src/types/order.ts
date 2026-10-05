import { Customer } from './customer';
import { OrderApprovalHistory } from './approval';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
}

export interface SalesOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  creator_id: number;
  creator_name: string;
  status: OrderStatus;
  subtotal: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  requires_approval: boolean;
  notes?: string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail extends SalesOrder {
  customer: Customer;
  items: OrderItem[];
  approvals: OrderApprovalHistory[];
}

export interface CreateOrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_id: number;
  items: CreateOrderItem[];
  tax_rate?: number;
  notes?: string;
}
