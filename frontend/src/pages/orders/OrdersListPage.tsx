import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders, useOrder, useCancelOrder } from '../../hooks/useOrders';
import { SalesOrder, OrderStatus } from '../../types/order';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { SlideOver } from '../../components/ui/SlideOver';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus, Eye, Ban, CheckCircle2, Clock } from 'lucide-react';

export const OrdersListPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  const { data, isLoading } = useOrders({
    page,
    page_size: 15,
    search: search || undefined,
    status: (statusFilter as OrderStatus) || undefined,
  });

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: orderDetail, isLoading: isLoadingDetail } = useOrder(selectedOrderId);

  const [cancellingOrder, setCancellingOrder] = useState<SalesOrder | null>(null);
  const cancelOrderMutation = useCancelOrder();

  const columns: Column<SalesOrder>[] = [
    {
      key: 'order_number',
      header: 'Order #',
      className: 'font-mono text-[11px] font-medium text-forest',
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (o) => <span className="font-medium text-forest">{o.customer_name}</span>,
    },
    {
      key: 'creator_name',
      header: 'Created By',
      render: (o) => <span className="text-forest-muted text-xs">{o.creator_name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge status={o.status} size="sm" />,
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      className: 'tabular-nums font-medium text-forest-dark',
      render: (o) => formatCurrency(o.total_amount),
    },
    {
      key: 'created_at',
      header: 'Date',
      className: 'text-forest-muted text-[11px]',
      render: (o) => formatDate(o.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (o) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedOrderId(o.id)}
            className="p-1.5 rounded-full hover:bg-forest-surface text-forest-muted hover:text-forest transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {['DRAFT', 'PENDING_APPROVAL'].includes(o.status) && (
            <button
              onClick={() => setCancellingOrder(o)}
              className="p-1.5 rounded-full hover:bg-forest-surface text-forest-muted hover:text-forest transition-colors"
              title="Cancel Order"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales Orders"
        subtitle="Track order processing lifecycles, stock verification, and approval statuses."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/orders/create')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Order
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items}
        total={data?.total}
        page={page}
        pageSize={15}
        totalPages={data?.total_pages}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowClick={(o) => setSelectedOrderId(o.id)}
        searchPlaceholder="Search by order # or customer..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-forest-border bg-white text-forest focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        }
      />

      {/* SlideOver Drawer for Order Inspection */}
      <SlideOver
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title={orderDetail ? `Order ${orderDetail.order_number}` : 'Order Details'}
        subtitle={orderDetail ? `Placed on ${formatDate(orderDetail.created_at)}` : ''}
        width="lg"
      >
        {isLoadingDetail || !orderDetail ? (
          <div className="flex flex-col gap-3 py-4">
            <div className="h-6 w-32 bg-mint-200 animate-pulse rounded-full" />
            <div className="h-24 w-full bg-mint-200 animate-pulse rounded-card" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Top Status & Customer Overview */}
            <div className="p-4 rounded-card bg-forest-surface border border-forest-border/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-forest-muted block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={orderDetail.status} />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-medium text-forest-muted block">Total Value</span>
                <span className="font-serif text-xl font-medium text-forest-dark tabular-nums block mt-0.5">
                  {formatCurrency(orderDetail.total_amount)}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest-muted mb-2">
                Customer Information
              </h3>
              <div className="p-3.5 rounded-input bg-white border border-forest-border/60 text-xs flex flex-col gap-1 text-forest">
                <span className="font-medium text-sm">{orderDetail.customer?.name}</span>
                <span className="text-forest-muted">{orderDetail.customer?.email}</span>
                {orderDetail.customer?.company && (
                  <span className="text-forest-muted">{orderDetail.customer.company}</span>
                )}
                {orderDetail.customer?.address && (
                  <span className="text-forest-muted">{orderDetail.customer.address}</span>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest-muted mb-2">
                Order Items ({orderDetail.items.length})
              </h3>
              <div className="border border-forest-border rounded-input overflow-hidden">
                <table className="w-full text-left text-xs text-forest">
                  <thead className="bg-forest-surface/70 border-b border-forest-border text-[11px] font-medium text-forest-muted">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-border/40">
                    {orderDetail.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5">
                          <span className="font-medium block">{item.product_name}</span>
                          <span className="font-mono text-[10px] text-forest-muted">
                            {item.product_sku}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-forest-dark">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-card bg-forest-surface border border-forest-border/80 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-forest-muted">
                <span>Subtotal:</span>
                <span className="tabular-nums font-medium text-forest">
                  {formatCurrency(orderDetail.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-forest-muted">
                <span>Tax ({orderDetail.tax_rate}%):</span>
                <span className="tabular-nums font-medium text-forest">
                  {formatCurrency(orderDetail.tax_amount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-forest-border font-serif text-sm font-medium text-forest-dark">
                <span>Total Amount:</span>
                <span className="tabular-nums font-bold">
                  {formatCurrency(orderDetail.total_amount)}
                </span>
              </div>
            </div>

            {/* Approval History Timeline */}
            {orderDetail.approvals && orderDetail.approvals.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-forest-muted mb-2">
                  Approval Audit Trail
                </h3>
                <div className="flex flex-col gap-2">
                  {orderDetail.approvals.map((appr) => (
                    <div
                      key={appr.id}
                      className="p-3 rounded-input bg-white border border-forest-border text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-forest">{appr.approver_name}</span>
                        <span className="text-[10px] text-forest-muted tabular-nums">
                          {formatDate(appr.decided_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={appr.decision} size="sm" />
                      </div>
                      {appr.comment && (
                        <p className="text-forest-muted italic mt-1 bg-forest-surface p-2 rounded-input">
                          "{appr.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        onConfirm={async () => {
          if (cancellingOrder) {
            await cancelOrderMutation.mutateAsync(cancellingOrder.id);
            setCancellingOrder(null);
          }
        }}
        title="Cancel Order"
        description={`Are you sure you want to cancel order ${cancellingOrder?.order_number}? This action cannot be undone.`}
        confirmLabel="Cancel Order"
        variant="danger"
        isLoading={cancelOrderMutation.isPending}
      />
    </div>
  );
};
