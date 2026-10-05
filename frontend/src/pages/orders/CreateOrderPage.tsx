import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { useCreateOrder } from '../../hooks/useOrders';
import { useSettings } from '../../hooks/useSettings';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { formatCurrency } from '../../lib/utils';
import { Plus, Trash2, ArrowLeft, AlertCircle, ShieldAlert, Check, ShoppingCart, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderLine {
  product_id: number;
  quantity: number;
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: customerData } = useCustomers({ page_size: 100, is_active: true });
  const { data: productData } = useProducts({ page_size: 100, is_active: true });
  const { data: settings } = useSettings();

  const thresholdSetting = settings?.find((s) => s.key === 'approval_threshold');
  const approvalThreshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 1000.0;

  const createOrderMutation = useCreateOrder();

  const [customerId, setCustomerId] = useState<number | ''>('');
  const [taxRate, setTaxRate] = useState<number>(0.0);
  const [notes, setNotes] = useState<string>('');
  const [lines, setLines] = useState<OrderLine[]>([{ product_id: 0, quantity: 1 }]);

  const productsMap = useMemo(() => {
    const map = new Map();
    productData?.items?.forEach((p) => map.set(p.id, p));
    return map;
  }, [productData]);

  // Financial calculations
  const { subtotal, taxAmount, totalAmount, hasStockIssue } = useMemo(() => {
    let sub = 0;
    let stockIssue = false;

    lines.forEach((line) => {
      const prod = productsMap.get(line.product_id);
      if (prod && line.quantity > 0) {
        sub += Number(prod.price) * line.quantity;
        if (line.quantity > prod.stock_quantity) {
          stockIssue = true;
        }
      }
    });

    const tax = (sub * taxRate) / 100.0;
    const tot = sub + tax;

    return {
      subtotal: sub,
      taxAmount: tax,
      totalAmount: tot,
      hasStockIssue: stockIssue,
    };
  }, [lines, productsMap, taxRate]);

  const requiresApproval = totalAmount > approvalThreshold;

  const handleAddLine = () => {
    setLines([...lines, { product_id: 0, quantity: 1 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: 'product_id' | 'quantity', val: number) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: val };
    setLines(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer.');
      return;
    }

    const validLines = lines.filter((l) => l.product_id > 0 && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one valid product line.');
      return;
    }

    // Check duplicate products
    const pids = validLines.map((l) => l.product_id);
    if (new Set(pids).size !== pids.length) {
      toast.error('Each product line must be unique.');
      return;
    }

    if (hasStockIssue) {
      toast.error('Some line items exceed currently available inventory.');
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        customer_id: Number(customerId),
        items: validLines,
        tax_rate: taxRate,
        notes: notes.trim() || undefined,
      });
      navigate('/orders');
    } catch (err) {
      // Handled in mutation onError
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Create Sales Order"
        subtitle="Configure line items, review live inventory availability, and submit orders for validation."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Orders
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Left Column: Form Details & Product Line Items (8 Cols on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Customer & Tax Card */}
          <div className="bg-surface rounded-card p-5 sm:p-6 border border-border shadow-card flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-accent flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h2 className="text-title text-base font-semibold">Customer &amp; Billing Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Customer" required>
                <Select
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value) || '')}
                  required
                >
                  <option value="">Select a customer...</option>
                  {customerData?.items?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Tax Rate (%)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </FormField>
            </div>

            <FormField label="Order Notes / Delivery Instructions">
              <Textarea
                placeholder="Optional notes or purchase order references..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </FormField>
          </div>

          {/* Product Line Items Card */}
          <div className="bg-surface rounded-card p-5 sm:p-6 border border-border shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-accent flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h2 className="text-title text-base font-semibold">
                  Product Line Items ({lines.length})
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Line Item
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {lines.map((line, idx) => {
                const selectedProduct = productsMap.get(line.product_id);
                const isOverStock =
                  selectedProduct && line.quantity > selectedProduct.stock_quantity;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-card bg-surfaceAlt/60 border border-border flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors hover:bg-surfaceAlt"
                  >
                    {/* Product Picker */}
                    <div className="flex-1 w-full">
                      <Select
                        value={line.product_id}
                        onChange={(e) =>
                          handleLineChange(idx, 'product_id', parseInt(e.target.value, 10) || 0)
                        }
                        required
                      >
                        <option value={0}>Select a product...</option>
                        {productData?.items?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.name} ({formatCurrency(p.price)} | {p.stock_quantity} available)
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="w-full sm:w-28 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                        }
                        hasError={isOverStock}
                        required
                      />
                    </div>

                    {/* Line Total */}
                    <div className="w-full sm:w-28 text-left sm:text-right shrink-0">
                      <span className="text-caption text-muted sm:hidden">Line Total: </span>
                      <span className="text-body text-text font-semibold tabular-nums">
                        {selectedProduct
                          ? formatCurrency(Number(selectedProduct.price) * line.quantity)
                          : '₹0.00'}
                      </span>
                    </div>

                    {/* Remove line */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length === 1}
                      className="p-2 rounded-full hover:bg-dangerSoft text-muted hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed transition-colors self-end sm:self-center"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {hasStockIssue && (
              <div className="p-3 rounded-card bg-dangerSoft text-danger border border-danger/30 text-caption flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  One or more line items specify a quantity exceeding available warehouse stock.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Summary & Review (4 Cols on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6 flex flex-col gap-6">
          <div className="bg-surface rounded-card p-5 sm:p-6 border border-border shadow-card flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-accent flex items-center justify-center text-xs font-bold">
                3
              </span>
              <h2 className="text-title text-base font-semibold">Order Summary</h2>
            </div>

            {/* Financial breakdown */}
            <div className="p-4 rounded-card bg-surfaceAlt/80 border border-border flex flex-col gap-2.5 text-caption">
              <div className="flex justify-between text-muted">
                <span>Subtotal:</span>
                <span className="tabular-nums text-body font-medium text-text">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Estimated Tax ({taxRate}%):</span>
                <span className="tabular-nums text-body font-medium text-text">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border text-title">
                <span className="font-semibold text-text">Total Amount:</span>
                <span className="tabular-nums text-lg font-bold text-accent">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Threshold & Approval Status Card */}
            {requiresApproval ? (
              <div className="p-4 rounded-card bg-warningSoft/50 border border-warning/40 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <span className="text-caption font-semibold text-text block">
                    Requires Manager Approval
                  </span>
                  <p className="text-caption text-muted mt-1 leading-relaxed text-xs">
                    Order total of <strong>{formatCurrency(totalAmount)}</strong> exceeds threshold (
                    <strong>{formatCurrency(approvalThreshold)}</strong>). Upon submission, order enters{' '}
                    <span className="font-mono font-semibold text-text">PENDING_APPROVAL</span> status and
                    notifies managers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-card bg-primarySoft/60 border border-primary/40 flex items-start gap-3">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-caption font-semibold text-text block">
                    Instant Auto-Fulfillment
                  </span>
                  <p className="text-caption text-muted mt-1 leading-relaxed text-xs">
                    Within standard threshold (<strong>{formatCurrency(approvalThreshold)}</strong>). Stock
                    is immediately allocated and completed upon submission.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={createOrderMutation.isPending}
                disabled={hasStockIssue}
                className="w-full justify-center"
              >
                {requiresApproval ? 'Submit for Manager Approval' : 'Create & Complete Order'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/orders')}
                className="w-full justify-center"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
