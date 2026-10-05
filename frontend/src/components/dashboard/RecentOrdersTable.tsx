import React from 'react';
import { Link } from 'react-router-dom';
import { SalesOrder } from '../../types/order';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { DashboardCard } from './DashboardCard';
import { ArrowUpRight, Eye } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: SalesOrder[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelectOrder?: (id: number) => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  isLoading = false,
  isError = false,
  onRetry,
  onSelectOrder,
}) => {
  return (
    <DashboardCard
      title="Recent Orders"
      subtitle="Latest sales orders processed across teams"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      fixedHeight={false}
      isEmpty={orders.length === 0}
      emptyMessage="No data for this range"
      action={
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-caption text-subtitle hover:text-muted transition-colors"
        >
          View all
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="overflow-x-auto -mx-4 -mb-4">
        <table className="w-full text-left text-caption text-text">
          <thead>
            <tr className="border-b border-border bg-surfaceAlt/70 text-muted uppercase text-[10px]">
              <th className="px-4 py-2.5">Order #</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.slice(0, 6).map((order) => (
              <tr
                key={order.id}
                className="hover:bg-surfaceAlt/40 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-[11px] text-subtitle">
                  {order.order_number}
                </td>
                <td className="px-4 py-2.5 max-w-[150px] truncate">
                  {order.customer_name}
                </td>
                <td className="px-4 py-2.5 text-muted whitespace-nowrap text-[11px]">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-text whitespace-nowrap">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <StatusBadge status={order.status} size="sm" />
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Link
                    to={`/orders?view=${order.id}`}
                    onClick={() => onSelectOrder?.(order.id)}
                    className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surfaceAlt inline-flex transition-colors"
                    title="View Order"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
};
