export interface DashboardKPISummary {
  total_sales_revenue: number | string;
  total_orders_count: number;
  pending_approvals_count: number;
  low_stock_items_count: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
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

export interface DashboardSummary {
  kpis: DashboardKPISummary;
  sales_trend: SalesTrendPoint[];
  status_distribution: OrderStatusCount[];
  top_products: TopSellingProduct[];
}
