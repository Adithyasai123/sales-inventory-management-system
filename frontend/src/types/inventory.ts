export type MovementType = 'IN' | 'OUT' | 'ADJUST';

export interface InventoryMovement {
  id: number;
  product_id: number;
  product_sku: string;
  product_name: string;
  movement_type: MovementType;
  quantity: number;
  balance_after: number;
  reference_order_id?: number;
  reason?: string;
  created_at: string;
}

export interface LowStockAlert {
  product_id: number;
  sku: string;
  name: string;
  category?: string;
  stock_quantity: number;
  reorder_level: number;
  shortage: number;
}
