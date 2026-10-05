export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price: string | number;
  cost_price?: string | number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  is_low_stock?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost_price?: number;
  stock_quantity?: number;
  reorder_level?: number;
  is_active?: boolean;
}

export interface StockAdjustPayload {
  movement_type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: string;
}
