import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SalesOrder } from '../../types/order';
import { useSubmitApprovalAction } from '../../hooks/useApprovals';
import { formatCurrency, formatDate } from '../../lib/utils';
import { DashboardCard } from './DashboardCard';
import { Skeleton } from '../ui/Skeleton';
import { ArrowUpRight, Check, X, Loader2 } from 'lucide-react';

interface PendingApprovalsCardProps {
  orders: SalesOrder[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const PendingApprovalsCard: React.FC<PendingApprovalsCardProps> = ({
  orders,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const submitActionMutation = useSubmitApprovalAction();
  const [actingOrderId, setActingOrderId] = useState<number | null>(null);

  const handleAction = async (orderId: number, decision: 'APPROVED' | 'REJECTED') => {
    try {
      setActingOrderId(orderId);
      await submitActionMutation.mutateAsync({
        id: orderId,
        payload: {
          decision,
          comment: decision === 'APPROVED' ? 'Approved via Dashboard' : 'Rejected via Dashboard',
        },
      });
    } finally {
      setActingOrderId(null);
    }
  };

  const pendingOrders = orders.slice(0, 3);

  return (
    <DashboardCard
      title="Pending Approvals"
      subtitle="Orders requiring manager review"
      isLoading={false}
      isError={isError}
      onRetry={onRetry}
      fixedHeight={false}
      isEmpty={!isLoading && pendingOrders.length === 0}
      emptyMessage="No pending orders awaiting review"
      action={
        <Link
          to="/approvals"
          className="inline-flex items-center gap-1 text-caption text-subtitle hover:text-muted transition-colors"
        >
          View queue
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`pending-skel-${i}`}
              className="p-3 rounded-input bg-surfaceAlt/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <Skeleton className="w-16 h-7 rounded-btn" />
                <Skeleton className="w-16 h-7 rounded-btn" />
              </div>
            </div>
          ))
        ) : pendingOrders.map((order) => {
          const isActing = actingOrderId === order.id;

          return (
            <div
              key={order.id}
              className="p-3 rounded-input bg-surfaceAlt/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors hover:bg-surfaceAlt"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-caption text-subtitle">
                    {order.order_number}
                  </span>
                  <span className="text-[10px] text-muted">
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <p className="text-caption text-body truncate mt-0.5">
                  {order.customer_name}
                </p>
                <p className="text-caption text-subtitle mt-0.5 tabular-nums">
                  {formatCurrency(order.total_amount)}
                </p>
              </div>

              {/* Inline Approve / Reject Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleAction(order.id, 'APPROVED')}
                  disabled={isActing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-body rounded-full bg-primary text-primaryText hover:bg-primary/80 border border-transparent shadow-card transition-all disabled:opacity-50"
                  title="Approve order"
                >
                  {isActing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => handleAction(order.id, 'REJECTED')}
                  disabled={isActing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-body rounded-full bg-surface text-text hover:bg-surfaceAlt border border-border transition-all disabled:opacity-50"
                  title="Reject order"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
};
