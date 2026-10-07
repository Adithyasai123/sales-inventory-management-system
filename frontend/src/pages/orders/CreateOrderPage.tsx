import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { useCreateOrder } from '../../hooks/useOrders';
import { useSettings } from '../../hooks/useSettings';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { SearchableSelect, SelectOption } from '../../components/ui/SearchableSelect';
import { formatCurrency, cn } from '../../lib/utils';
import { Plus, Trash2, ArrowLeft, AlertCircle, ShieldAlert, Check, ShoppingCart, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderLine {
  product_id: number;
  quantity: number;
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: customerData, isLoading: isLoadingCustomers } = useCustomers({ page_size: 100, is_active: true });
  const { data: productData, isLoading: isLoadingProducts } = useProducts({ page_size: 100, is_active: true });
  const { data: settings } = useSettings();

  const thresholdSetting = settings?.find((s) => s.key === 'approval_threshold');
  const approvalThreshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 1000.0;

  const createOrderMutation = useCreateOrder();

  const [customerId, setCustomerId] = useState<number | ''>('');
  const [taxRateInput, setTaxRateInput] = useState<string>('18');
  const [notes, setNotes] = useState<string>('');
  const [lines, setLines] = useState<OrderLine[]>([{ product_id: 0, quantity: 1 }]);

  const taxRate = useMemo(() => {
    if (!taxRateInput.trim()) return 0;
    const val = parseFloat(taxRateInput);
    return isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
  }, [taxRateInput]);

  const customerOptions = useMemo<SelectOption[]>(() => {
    if (!customerData?.items) return [];
    return customerData.items.map((c) => ({
      value: c.id,
      label: c.name,
      description: `${c.company ? c.company + ' • ' : ''}${c.email || 'No email'}${c.phone ? ' • ' + c.phone : ''}`,
      badge: c.city || 'Verified',
    }));
  }, [customerData?.items]);

  const productOptions = useMemo<SelectOption[]>(() => {
    if (!productData?.items) return [];
    return productData.items.map((p) => {
      const isOutOfStock = p.stock_quantity <= 0;
      const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
      const stockBadge = isOutOfStock
        ? 'Out of Stock'
        : isLowStock
        ? `${p.stock_quantity} left`
        : `${p.stock_quantity} in stock`;
      const stockBadgeColor = isOutOfStock
        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        : isLowStock
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

      return {
        value: p.id,
        label: p.name,
        description: `SKU: ${p.sku} • ${p.category || 'General'}`,
        badge: formatCurrency(p.price),
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
        stockText: stockBadge,
        stockColor: stockBadgeColor,
      };
    });
  }, [productData?.items]);

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
              <div>
                <SearchableSelect
                  label="Customer"
                  required
                  value={customerId}
                  onChange={(val) => setCustomerId(val ? Number(val) : '')}
                  options={customerOptions}
                  isLoading={isLoadingCustomers}
                  placeholder="Select a customer..."
                  searchPlaceholder="Search by name, company, email..."
                  minSearchCount={2}
                  isClearable
                  showBadgeInTrigger={false}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text">
                    Tax Rate (%)
                  </label>
                  <span className="text-[11px] text-muted font-mono font-medium">
                    Applied: <strong className="text-accent">{taxRate}%</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(taxRateInput) || 0;
                      const next = Math.max(0, cur - 1);
                      setTaxRateInput(next.toString());
                    }}
                    className="w-10 h-10 rounded-xl bg-surfaceAlt border border-border hover:bg-surface text-text font-bold text-base flex items-center justify-center shrink-0 transition-colors shadow-xs hover:border-accent/40 cursor-pointer"
                    title="Decrease Tax Rate by 1%"
                  >
                    -
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={taxRateInput}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                            setTaxRateInput(val.replace(/^0+/, ''));
                          } else {
                            setTaxRateInput(val);
                          }
                        }
                      }}
                      className="w-full h-10 px-3.5 pr-8 rounded-xl bg-surface border border-border text-sm font-semibold text-text tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent shadow-xs"
                      placeholder="e.g. 18"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                      %
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(taxRateInput) || 0;
                      const next = Math.min(100, cur + 1);
                      setTaxRateInput(next.toString());
                    }}
                    className="w-10 h-10 rounded-xl bg-surfaceAlt border border-border hover:bg-surface text-text font-bold text-base flex items-center justify-center shrink-0 transition-colors shadow-xs hover:border-accent/40 cursor-pointer"
                    title="Increase Tax Rate by 1%"
                  >
                    +
                  </button>
                </div>

                {/* Quick Indian GST Slabs Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-muted font-medium uppercase tracking-wider mr-0.5">Presets:</span>
                  {[
                    { label: '0%', val: '0' },
                    { label: '5%', val: '5' },
                    { label: '12%', val: '12' },
                    { label: '18% GST', val: '18' },
                    { label: '28%', val: '28' },
                  ].map((preset) => {
                    const isActive = Math.abs(taxRate - parseFloat(preset.val)) < 0.01;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setTaxRateInput(preset.val)}
                        className={cn(
                          'px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all border shadow-xs cursor-pointer',
                          isActive
                            ? 'bg-accent/20 border-accent text-accent font-bold ring-1 ring-accent/30'
                            : 'bg-surfaceAlt/80 border-border/80 text-muted hover:text-text hover:bg-surfaceAlt'
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
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
                      <SearchableSelect
                        value={line.product_id}
                        onChange={(val) =>
                          handleLineChange(idx, 'product_id', parseInt(val, 10) || 0)
                        }
                        options={productOptions}
                        isLoading={isLoadingProducts}
                        placeholder="Select a product..."
                        searchPlaceholder="Search product by SKU or name..."
                        minSearchCount={2}
                        dropdownWidth="wide"
                        showBadgeInTrigger={false}
                      />
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
                          : formatCurrency(0)}
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

              {subtotal === 0 && (
                <div className="text-[11px] text-muted/80 text-center py-1.5 px-2 bg-surface/60 rounded-lg border border-border/40 mt-1">
                  💡 Select products in Step 2 to compute live tax &amp; total amount
                </div>
              )}
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
