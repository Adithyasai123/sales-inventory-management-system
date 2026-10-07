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
import { Plus, Eye, Ban, CheckCircle2, Clock, Download, FileText, Printer } from 'lucide-react';
import { ordersApi } from '../../api';
import { InvoiceModal } from '../../components/orders/InvoiceModal';
import { OrderReviewDrawerSkeleton } from '../../components/orders/OrderReviewDrawerSkeleton';

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
  const [isExporting, setIsExporting] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await ordersApi.exportCsv({
        search: search || undefined,
        status: (statusFilter as OrderStatus) || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to export CSV', e);
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<SalesOrder>[] = [
    {
      key: 'order_number',
      header: 'Order #',
      width: '160px',
      className: 'font-mono text-[11px] text-body',
    },
    {
      key: 'customer_name',
      header: 'Customer',
      width: '280px',
      render: (o) => <span className="text-body font-medium">{o.customer_name}</span>,
    },
    {
      key: 'creator_name',
      header: 'Created By',
      width: '140px',
      render: (o) => <span className="text-muted text-caption">{o.creator_name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (o) => <StatusBadge status={o.status} size="sm" />,
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      width: '140px',
      className: 'tabular-nums text-body',
      render: (o) => formatCurrency(o.total_amount),
    },
    {
      key: 'created_at',
      header: 'Date',
      width: '160px',
      className: 'text-muted text-[11px]',
      render: (o) => formatDate(o.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '90px',
      render: (o) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedOrderId(o.id)}
            className="p-1.5 rounded-full hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {['DRAFT', 'PENDING_APPROVAL'].includes(o.status) && (
            <button
              onClick={() => setCancellingOrder(o)}
              className="p-1.5 rounded-full hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
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
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Sales Orders"
        subtitle="Track order processing lifecycles, stock verification, and approval statuses."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/orders/create')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Order
            </Button>
          </div>
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
              className="px-3 py-1.5 rounded-full text-caption border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-chart1"
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
          <OrderReviewDrawerSkeleton />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Top Status & Customer Overview */}
            <div className="p-4 rounded-card bg-surfaceAlt border border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={orderDetail.status} />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-muted block">Total Value</span>
                <span className="text-title tabular-nums block mt-0.5">
                  {formatCurrency(orderDetail.total_amount)}
                </span>
              </div>
            </div>

            {/* Quick Actions Strip */}
            {orderDetail.status === 'COMPLETED' ? (
              <div className="flex items-center justify-between p-3 rounded-card bg-surfaceAlt/50 border border-border">
                <span className="text-caption text-textMuted font-medium">Official Tax Documentation</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInvoiceOpen(true)}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print / View Invoice
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-card bg-surfaceAlt/30 border border-border/50 text-xs text-muted">
                <span>Tax invoice is generated upon order completion.</span>
                <span className="font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border text-[10px]">
                  {orderDetail.status.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Customer Details */}
            <div>
              <h3 className="text-caption uppercase tracking-wider text-muted mb-2">
                Customer Information
              </h3>
              <div className="p-3.5 rounded-input bg-surfaceAlt/60 border border-border text-caption flex flex-col gap-1 text-text">
                <span className="text-body">{orderDetail.customer?.name}</span>
                <span className="text-muted">{orderDetail.customer?.email}</span>
                {orderDetail.customer?.company && (
                  <span className="text-muted">{orderDetail.customer.company}</span>
                )}
                {orderDetail.customer?.address && (
                  <span className="text-muted">{orderDetail.customer.address}</span>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-caption uppercase tracking-wider text-muted mb-2">
                Order Items ({orderDetail.items.length})
              </h3>
              <div className="border border-border rounded-input overflow-hidden">
                <table className="w-full text-left text-caption text-text">
                  <thead className="bg-surfaceAlt border-b border-border text-[11px] text-muted">
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
                          <span className="block">{item.product_name}</span>
                          <span className="font-mono text-[10px] text-muted">
                            {item.product_sku}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-text">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-card bg-surfaceAlt border border-border flex flex-col gap-1.5 text-caption">
              <div className="flex justify-between text-muted">
                <span>Subtotal:</span>
                <span className="tabular-nums text-body">
                  {formatCurrency(orderDetail.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Tax ({orderDetail.tax_rate}%):</span>
                <span className="tabular-nums text-body">
                  {formatCurrency(orderDetail.tax_amount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border text-body">
                <span>Total Amount:</span>
                <span className="tabular-nums">
                  {formatCurrency(orderDetail.total_amount)}
                </span>
              </div>
            </div>

            {/* Approval History Timeline */}
            {orderDetail.approvals && orderDetail.approvals.length > 0 && (
              <div>
                <h3 className="text-caption uppercase tracking-wider text-muted mb-2">
                  Approval Audit Trail
                </h3>
                <div className="flex flex-col gap-2">
                  {orderDetail.approvals.map((appr) => (
                    <div
                      key={appr.id}
                      className="p-3 rounded-input bg-surface border border-border text-caption flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-body">{appr.approver_name}</span>
                        <span className="text-[10px] text-muted tabular-nums">
                          {formatDate(appr.decided_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={appr.decision} size="sm" />
                      </div>
                      {appr.comment && (
                        <p className="text-muted italic mt-1 bg-surfaceAlt p-2 rounded-input">
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

      {/* Printable Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={orderDetail || null}
      />
    </div>
  );
};
