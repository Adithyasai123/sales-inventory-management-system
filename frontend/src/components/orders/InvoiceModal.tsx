import React from 'react';
import { OrderDetail } from '../../types/order';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Printer, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetail | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'COMPLETED':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" /> Paid & Approved
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> {order.status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surfaceAlt text-textMuted border border-border">
            {order.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-3xl bg-surface border border-border rounded-card shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surfaceAlt print:hidden">
          <div className="flex items-center gap-3">
            <h3 className="text-title text-base font-semibold">Tax Invoice — {order.order_number}</h3>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              disabled={order.status !== 'COMPLETED' && order.status !== 'APPROVED'}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Invoice
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-textMuted hover:text-text hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {order.status !== 'COMPLETED' && order.status !== 'APPROVED' && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500 flex items-center gap-2 print:hidden">
            <span>Notice: Official Tax Invoices are generated exclusively for fulfilled and completed orders. This order is currently {order.status}.</span>
          </div>
        )}

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice" className="p-8 overflow-y-auto space-y-6 text-text bg-surface">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-lg bg-accent text-accentText flex items-center justify-center font-bold text-sm">
                  S
                </span>
                <span className="font-serif text-xl font-bold tracking-tight">SIMS Enterprise</span>
              </div>
              <p className="text-caption text-textMuted">Sales & Inventory Management System</p>
              <p className="text-caption text-textMuted">GSTIN: 29AABCU9603R1ZX</p>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-serif font-bold uppercase tracking-wider text-accent">TAX INVOICE</h1>
              <p className="text-caption font-semibold mt-1">Invoice #{order.order_number}</p>
              <p className="text-caption text-textMuted">Date: {formatDate(order.created_at)}</p>
              <p className="text-caption text-textMuted">Issued by: {order.creator_name || 'System'}</p>
            </div>
          </div>

          {/* Bill To Info */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-surfaceAlt/50 border border-border/60">
            <div>
              <p className="text-overline mb-1">Billed To Customer</p>
              <p className="text-body font-semibold">{order.customer?.name || order.customer_name}</p>
              {order.customer?.company && <p className="text-caption text-textMuted">{order.customer.company}</p>}
              <p className="text-caption text-textMuted">{order.customer?.email}</p>
              {order.customer?.phone && <p className="text-caption text-textMuted">{order.customer.phone}</p>}
            </div>
            <div>
              <p className="text-overline mb-1">Shipping & Destination</p>
              <p className="text-caption text-textMuted">
                {order.customer?.address ? `${order.customer.address}, ` : ''}
                {order.customer?.city ? `${order.customer.city}, ` : ''}
                {order.customer?.country || 'India'}
              </p>
              <p className="text-caption text-textMuted mt-2">
                Payment Terms: <span className="font-medium text-text">Immediate / Verified Order</span>
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surfaceAlt text-overline border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Item & SKU</th>
                  <th className="px-4 py-2.5 text-right">Unit Price</th>
                  <th className="px-4 py-2.5 text-center">Qty</th>
                  <th className="px-4 py-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {order.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-surfaceAlt/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text">{item.product_name}</p>
                      <p className="text-caption text-textMuted font-mono text-[11px]">{item.product_sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-textMuted">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-text">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-textMuted">
                <span>GST / Tax ({Math.round(Number(order.tax_rate || 0.1) * 100)}%)</span>
                <span className="tabular-nums font-medium text-text">{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-accent">
                <span>Grand Total</span>
                <span className="tabular-nums">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="border-t border-border/80 pt-4 text-center text-caption text-textMuted space-y-1">
            <p>Thank you for choosing SIMS. This is a computer-generated invoice and requires no physical signature.</p>
            <p className="text-[10px]">For queries or order returns, please contact billing@sims.local</p>
          </div>
        </div>
      </div>
    </div>
  );
};
