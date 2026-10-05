export interface DashboardKPISummary {
  total_sales_revenue: number | string;
  revenue_prev?: number | string;
  revenue_delta?: number;
  revenue_sparkline?: number[];

  total_orders_count: number;
  orders_prev?: number;
  orders_delta?: number;
  orders_sparkline?: number[];

  avg_order_value: number | string;
  avg_order_value_prev?: number | string;
  avg_order_value_delta?: number;
  avg_order_value_sparkline?: number[];

  pending_approvals_count: number;
  pending_approvals_prev?: number;
  pending_approvals_delta?: number;
  pending_approvals_sparkline?: number[];

  low_stock_items_count: number;
  low_stock_prev?: number;
  low_stock_delta?: number;
  low_stock_sparkline?: number[];

  inventory_value: number | string;
  inventory_value_prev?: number | string;
  inventory_value_delta?: number;
  inventory_value_sparkline?: number[];
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  previous_revenue?: number;
  orders_count: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface TopSellingProduct {
  product_id: number;
  sku: string;
  name: string;
  units_sold: number;
  total_revenue: number | string;
}

export interface TopCustomer {
  customer_id: number;
  customer_name: string;
  orders_count: number;
  total_revenue: number | string;
}

export interface InventoryHealthItem {
  product_id: number;
  sku: string;
  name: string;
  stock_quantity: number;
  reorder_level: number;
  is_low_stock: boolean;
  unit_price: number | string;
}

export interface ApprovalStats {
  created_count: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  avg_decision_time_hours: number;
  avg_decision_time_formatted: string;
}

export interface MovementTrendPoint {
  date: string;
  in_qty: number;
  out_qty: number;
}

export interface DashboardSummary {
  kpis: DashboardKPISummary;
  sales_trend: SalesTrendPoint[];
  status_distribution: OrderStatusCount[];
  top_products: TopSellingProduct[];
  range_days?: number;
}
