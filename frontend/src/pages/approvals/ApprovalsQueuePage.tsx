import React, { useState } from 'react';
import { usePendingApprovals, useSubmitApprovalAction } from '../../hooks/useApprovals';
import { useOrder } from '../../hooks/useOrders';
import { SalesOrder } from '../../types/order';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { SlideOver } from '../../components/ui/SlideOver';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormField, Textarea } from '../../components/ui/FormField';
import { formatCurrency, formatDate } from '../../lib/utils';
import { CheckCircle2, XCircle, Eye, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ApprovalsQueuePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePendingApprovals({ page, page_size: 15 });

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: orderDetail, isLoading: isLoadingDetail } = useOrder(selectedOrderId);

  const [decisionOrder, setDecisionOrder] = useState<SalesOrder | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');

  const submitActionMutation = useSubmitApprovalAction();

  const handleOpenDecision = (order: SalesOrder, type: 'APPROVED' | 'REJECTED') => {
    setDecisionOrder(order);
    setDecisionType(type);
    setComment('');
  };

  const handleConfirmDecision = async () => {
    if (!decisionOrder) return;
    if (!comment.trim()) {
      toast.error('An audit explanation / comment is required for this decision.');
      return;
    }

    try {
      await submitActionMutation.mutateAsync({
        id: decisionOrder.id,
        payload: {
          decision: decisionType,
          comment: comment.trim(),
        },
      });
      setDecisionOrder(null);
      if (selectedOrderId === decisionOrder.id) {
        setSelectedOrderId(null);
      }
    } catch (err) {
      // Handled in mutation onError
    }
  };

  const columns: Column<SalesOrder>[] = [
    {
      key: 'order_number',
      header: 'Order #',
      className: 'font-mono text-[11px] text-body ',
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (o) => <span className="text-body">{o.customer_name}</span>,
    },
    {
      key: 'creator_name',
      header: 'Created By',
      render: (o) => <span className="text-muted text-caption">{o.creator_name}</span>,
    },
    {
      key: 'total_amount',
      header: 'Order Value',
      className: 'tabular-nums  text-body text-body ',
      render: (o) => formatCurrency(o.total_amount),
    },
    {
      key: 'created_at',
      header: 'Submitted',
      className: 'text-muted text-[11px]',
      render: (o) => formatDate(o.created_at),
    },
    {
      key: 'actions',
      header: 'Review Actions',
      render: (o) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedOrderId(o.id)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Review
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenDecision(o, 'APPROVED')}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Approve
          </Button>
          <Button
            variant="forest"
            size="sm"
            onClick={() => handleOpenDecision(o, 'REJECTED')}
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manager Approvals Queue"
        subtitle="Review orders exceeding monetary threshold. Approving atomically locks inventory rows, validates stock, and fulfills the order."
        hero="approvals"
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
        emptyAnimation="all-caught-up"
        emptyTitle="You're all caught up!"
        emptyDescription="There are currently no sales orders waiting for manager approval."
      />

      {/* SlideOver Order Inspection Drawer */}
      <SlideOver
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title={orderDetail ? `Review Order ${orderDetail.order_number}` : 'Order Review'}
        subtitle={orderDetail ? `Customer: ${orderDetail.customer?.name}` : ''}
        width="lg"
      >
        {isLoadingDetail || !orderDetail ? (
          <div className="h-48 bg-primarySoft animate-pulse rounded-card" />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-card bg-surfaceAlt border border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted block">Status</span>
                <StatusBadge status={orderDetail.status} />
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted block">Total Value</span>
                <span className="text-title tabular-nums">
                  {formatCurrency(orderDetail.total_amount)}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-caption uppercase tracking-wider text-muted mb-2">
                Order Line Items
              </h3>
              <div className="border border-border rounded-input overflow-hidden">
                <table className="w-full text-left text-caption text-text">
                  <thead className="bg-surfaceAlt border-b border-border text-[11px] text-muted">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
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

            {/* Manager Actions Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                variant="forest"
                size="md"
                onClick={() => handleOpenDecision(orderDetail, 'REJECTED')}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Reject Order
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenDecision(orderDetail, 'APPROVED')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Approve & Fulfill
              </Button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Decision Dialog with Required Comment */}
      <ConfirmDialog
        isOpen={!!decisionOrder}
        onClose={() => setDecisionOrder(null)}
        onConfirm={handleConfirmDecision}
        title={`${decisionType === 'APPROVED' ? 'Approve' : 'Reject'} Order ${decisionOrder?.order_number}`}
        description={
          decisionType === 'APPROVED'
            ? 'Approving will lock product rows, re-validate inventory, deduct stock, and notify the order creator by email.'
            : 'Rejecting will cancel fulfillment and notify the creator with your feedback comment.'
        }
        confirmLabel={decisionType === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
        variant={decisionType === 'APPROVED' ? 'primary' : 'forest'}
        isLoading={submitActionMutation.isPending}
      >
        <div className="mt-2">
          <FormField label="Manager Audit Comment / Explanation" required>
            <Textarea
              placeholder={
                decisionType === 'APPROVED'
                  ? 'e.g. Verified customer credit and stock allocation approved.'
                  : 'e.g. Pricing margin insufficient; customer needs to re-quote.'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </FormField>
        </div>
      </ConfirmDialog>
    </div>
  );
};
