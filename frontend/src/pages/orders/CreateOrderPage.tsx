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
import { Plus, Trash2, ArrowLeft, AlertCircle, ShieldAlert, Check } from 'lucide-react';
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
    <div className="flex flex-col gap-6 max-w-4xl">
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Customer & Tax Card */}
        <div className="bg-white rounded-card p-6 border border-forest-border shadow-flat flex flex-col gap-4">
          <h2 className="font-serif text-lg font-medium text-forest">1. Customer & Billing</h2>
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
            />
          </FormField>
        </div>

        {/* Product Line Items Card */}
        <div className="bg-white rounded-card p-6 border border-forest-border shadow-flat flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-medium text-forest">2. Product Line Items</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
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
                  className="p-3.5 rounded-input bg-forest-surface/50 border border-forest-border flex flex-col sm:flex-row items-start sm:items-center gap-3"
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
                          {p.sku} — {p.name} ({formatCurrency(p.price)} | {p.stock_quantity} in stock)
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="w-28 shrink-0">
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                      }
                      hasError={isOverStock}
                      required
                    />
                  </div>

                  {/* Line Total */}
                  <div className="w-28 text-right shrink-0">
                    <span className="font-medium text-sm text-forest-dark tabular-nums">
                      {selectedProduct
                        ? formatCurrency(Number(selectedProduct.price) * line.quantity)
                        : '$0.00'}
                    </span>
                  </div>

                  {/* Remove line */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length === 1}
                    className="p-1.5 rounded-full hover:bg-white text-forest-muted hover:text-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {hasStockIssue && (
            <div className="p-3 rounded-input bg-white border border-forest text-xs text-forest flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-forest shrink-0" />
              <span>
                One or more line items specify a quantity exceeding available warehouse stock.
              </span>
            </div>
          )}
        </div>

        {/* Live Financial Totals & Calm Approval Banner */}
        <div className="bg-white rounded-card p-6 border border-forest-border shadow-flat flex flex-col gap-4">
          <h2 className="font-serif text-lg font-medium text-forest">3. Order Summary & Review</h2>

          <div className="p-4 rounded-input bg-forest-surface border border-forest-border flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-forest-muted">
              <span>Subtotal:</span>
              <span className="tabular-nums font-medium text-forest">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-forest-muted">
              <span>Estimated Tax ({taxRate}%):</span>
              <span className="tabular-nums font-medium text-forest">
                {formatCurrency(taxAmount)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-forest-border font-serif text-lg font-medium text-forest-dark">
              <span>Total Amount:</span>
              <span className="tabular-nums font-bold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Calm "Needs manager approval" notice above the threshold */}
          {requiresApproval ? (
            <div className="p-3.5 rounded-card bg-forest-surface border border-forest-border flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-forest shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-forest block">
                  Needs Manager Approval
                </span>
                <p className="text-xs text-forest-muted mt-0.5 leading-relaxed">
                  This order total of <strong>{formatCurrency(totalAmount)}</strong> exceeds the
                  approval threshold of <strong>{formatCurrency(approvalThreshold)}</strong>.
                  Upon submission, the order will be placed in{' '}
                  <span className="font-medium text-forest">PENDING_APPROVAL</span> status, no
                  stock will be deducted yet, and email notifications will be automatically
                  dispatched to all active managers.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-card bg-mint-primary/30 border border-mint flex items-start gap-3">
              <Check className="w-5 h-5 text-forest-dark shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-forest-dark block">
                  Instant Confirmation
                </span>
                <p className="text-xs text-forest-muted mt-0.5 leading-relaxed">
                  This order is within the <strong>{formatCurrency(approvalThreshold)}</strong>{' '}
                  threshold. Stock will be immediately deducted and the order completed upon
                  submission.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-forest-border">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/orders')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createOrderMutation.isPending}
              disabled={hasStockIssue}
            >
              {requiresApproval ? 'Submit for Manager Approval' : 'Create & Complete Order'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
