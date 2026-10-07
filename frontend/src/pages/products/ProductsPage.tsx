import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useRestoreProduct,
  useAdjustStock,
} from '../../hooks/useProducts';
import { Product, ProductInput, StockAdjustPayload } from '../../types/product';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../lib/utils';
import { Plus, SlidersHorizontal, Trash2, Edit3, AlertTriangle, Layers, RotateCcw } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { isManager, isWarehouse } = useAuth();
  const canAdjustStock = isManager || isWarehouse;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isLowStock, setIsLowStock] = useState<boolean | undefined>(undefined);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const { data, isLoading } = useProducts({
    page,
    page_size: 15,
    search: search || undefined,
    category: category || undefined,
    is_low_stock: isLowStock,
    include_deleted: includeDeleted,
  });

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const restoreProductMutation = useRestoreProduct();
  const adjustStockMutation = useAdjustStock();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState<ProductInput>({
    sku: '',
    name: '',
    description: '',
    category: '',
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    reorder_level: 10,
  });

  const [adjustData, setAdjustData] = useState<StockAdjustPayload>({
    movement_type: 'IN',
    quantity: 1,
    reason: '',
  });

  const handleOpenCreate = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      reorder_level: 10,
    });
    setEditingProduct(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      price: Number(p.price),
      cost_price: p.cost_price ? Number(p.cost_price) : 0,
      stock_quantity: p.stock_quantity,
      reorder_level: p.reorder_level,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        payload: formData,
      });
    } else {
      await createProductMutation.mutateAsync(formData);
    }
    setIsCreateModalOpen(false);
  };

  const handleStockAdjustSubmit = async () => {
    if (!adjustingProduct || !adjustData.reason) return;
    await adjustStockMutation.mutateAsync({
      id: adjustingProduct.id,
      payload: adjustData,
    });
    setAdjustingProduct(null);
    setAdjustData({ movement_type: 'IN', quantity: 1, reason: '' });
  };

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU',
      width: '140px',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-body">{p.sku}</span>
          {p.is_deleted && (
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              Archived
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      width: '280px',
      render: (p) => (
        <div>
          <span className="text-body block">{p.name}</span>
          {p.description && (
            <span className="text-caption line-clamp-1">
              {p.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '140px',
      render: (p) => (
        <span className="px-2 py-0.5 rounded-full bg-surfaceAlt text-muted text-[11px] border border-border">
          {p.category || 'General'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Unit Price',
      width: '140px',
      className: 'tabular-nums text-body',
      render: (p) => formatCurrency(p.price),
    },
    {
      key: 'stock_quantity',
      header: 'Available Stock',
      width: '240px',
      render: (p) => {
        const avail = p.available_stock !== undefined ? p.available_stock : Math.max(0, p.stock_quantity - (p.reserved_quantity || 0));
        const reserved = p.reserved_quantity || 0;
        const isLow = avail <= p.reorder_level;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`tabular-nums font-medium ${
                isLow ? 'text-amber-500' : 'text-text'
              }`}
            >
              {avail}
            </span>
            {reserved > 0 && (
              <span className="text-[10px] text-muted bg-surfaceAlt px-1.5 py-0.5 rounded border border-border" title="Held in pending approval orders">
                ({reserved} reserved)
              </span>
            )}
            {isLow && (
              <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                <AlertTriangle className="w-3 h-3" /> Low Stock
              </span>
            )}
            {isLow && canAdjustStock && !p.is_deleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAdjustingProduct(p);
                  setAdjustData({
                    movement_type: 'IN',
                    quantity: Math.max(10, p.reorder_level * 2 - p.stock_quantity),
                    reason: `Low stock replenishment (threshold: ${p.reorder_level})`,
                  });
                }}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent text-accentText hover:opacity-90 transition-opacity ml-1"
                title={`Quick Restock ${p.sku}`}
              >
                + Restock
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (p) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {canAdjustStock && !p.is_deleted && (
            <button
              onClick={() => {
                setAdjustingProduct(p);
                setAdjustData({ movement_type: 'IN', quantity: 1, reason: '' });
              }}
              className="p-1.5 rounded-full hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
              title="Adjust Stock"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
          {isManager && (
            <>
              {p.is_deleted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreProductMutation.mutate(p.id)}
                  isLoading={restoreProductMutation.isPending}
                  leftIcon={<RotateCcw className="w-3 h-3" />}
                  className="text-xs h-7 px-2"
                >
                  Restore
                </Button>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-full hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
                    title="Edit Product"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingProduct(p)}
                    className="p-1.5 rounded-full hover:bg-surfaceAlt text-muted hover:text-text transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products Catalog"
        subtitle="Manage product SKU records, catalog pricing, and inventory reorder levels."
        hero="products"
        action={
          isManager && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (data?.items && data.items.length > 0) {
                    setAdjustingProduct(data.items[0]);
                    setAdjustData({ movement_type: 'IN', quantity: 20, reason: 'Warehouse Inward Shipment' });
                  }
                }}
                leftIcon={<Layers className="w-4 h-4" />}
              >
                Inward Stock
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Product
              </Button>
            </div>
          )
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
        searchPlaceholder="Search by SKU, name, or category..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filters={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLowStock(isLowStock ? undefined : true)}
              className={`px-3 py-1.5 rounded-full text-caption border transition-colors ${
                isLowStock
                  ? 'bg-primary text-primaryText border-primary/40'
                  : 'bg-surface text-muted border-border hover:bg-surfaceAlt'
              }`}
            >
              Low Stock Only
            </button>
            <button
              onClick={() => {
                setIncludeDeleted(!includeDeleted);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-caption border transition-colors ${
                includeDeleted
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  : 'bg-surface text-muted border-border hover:bg-surfaceAlt'
              }`}
            >
              {includeDeleted ? 'Showing Archived' : 'Show Archived'}
            </button>
          </div>
        }
      />

      {/* Create / Edit Product Modal */}
      <ConfirmDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={() => {}}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        description="Enter product catalog details. The price must be strictly positive."
        confirmLabel=""
        cancelLabel="Close"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="flex flex-col gap-3.5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="SKU" required>
              <Input
                placeholder="PROD-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                disabled={!!editingProduct}
                required
              />
            </FormField>
            <FormField label="Category">
              <Input
                placeholder="Hardware"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Product Name" required>
            <Input
              placeholder="e.g. Mechanical Keyboard"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              placeholder="Optional specifications..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Selling Price" required>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </FormField>
            <FormField label="Cost Price">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!editingProduct && (
              <FormField label="Initial Stock" required>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_quantity: parseInt(e.target.value, 10) || 0 })
                  }
                  required
                />
              </FormField>
            )}
            <FormField label="Reorder Threshold" required>
              <Input
                type="number"
                min="0"
                value={formData.reorder_level}
                onChange={(e) =>
                  setFormData({ ...formData, reorder_level: parseInt(e.target.value, 10) || 0 })
                }
                required
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createProductMutation.isPending || updateProductMutation.isPending}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </ConfirmDialog>

      {/* Adjust Stock Modal */}
      <ConfirmDialog
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onConfirm={handleStockAdjustSubmit}
        title={`Adjust Stock: ${adjustingProduct?.sku}`}
        description={`Current on-hand balance: ${adjustingProduct?.stock_quantity} units. All stock adjustments are audited in the inventory ledger.`}
        confirmLabel="Apply Adjustment"
        isLoading={adjustStockMutation.isPending}
      >
        <div className="flex flex-col gap-3 mt-2">
          <FormField label="Adjustment Type" required>
            <Select
              value={adjustData.movement_type}
              onChange={(e) =>
                setAdjustData({
                  ...adjustData,
                  movement_type: e.target.value as 'IN' | 'OUT' | 'ADJUST',
                })
              }
            >
              <option value="IN">IN — Restock / Supplier Shipment</option>
              <option value="OUT">OUT — Damage / Shrinkage Write-off</option>
              <option value="ADJUST">ADJUST — Physical Audit Count</option>
            </Select>
          </FormField>

          <FormField label="Quantity" required>
            <Input
              type="number"
              min="1"
              value={adjustData.quantity}
              onChange={(e) =>
                setAdjustData({ ...adjustData, quantity: parseInt(e.target.value, 10) || 1 })
              }
              required
            />
          </FormField>

          <FormField label="Audit Reason" required>
            <Input
              placeholder="e.g. Warehouse monthly cycle count"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              required
            />
          </FormField>
        </div>
      </ConfirmDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={async () => {
          if (deletingProduct) {
            await deleteProductMutation.mutateAsync(deletingProduct.id);
            setDeletingProduct(null);
          }
        }}
        title="Delete Product"
        description={`Are you sure you want to deactivate SKU "${deletingProduct?.sku}"? Existing historical orders will retain their data.`}
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
};
