import React, { useState } from 'react';
import { useInventoryMovements, useLowStockAlerts } from '../../hooks/useInventory';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { InventoryMovement, LowStockAlert, MovementType } from '../../types/inventory';
import { formatDate } from '../../lib/utils';
import { Layers, AlertTriangle, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movements' | 'low-stock'>('movements');
  const [page, setPage] = useState(1);
  const [movementFilter, setMovementFilter] = useState<MovementType | ''>('');

  const { data: movementsData, isLoading: isLoadingMovements } = useInventoryMovements({
    page,
    page_size: 20,
    movement_type: (movementFilter as MovementType) || undefined,
  });

  const { data: lowStockData, isLoading: isLoadingLowStock } = useLowStockAlerts();

  const movementColumns: Column<InventoryMovement>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      className: 'text-forest-muted text-[11px]',
      render: (m) => formatDate(m.created_at),
    },
    {
      key: 'product_sku',
      header: 'SKU',
      className: 'font-mono text-[11px] font-medium text-forest',
    },
    {
      key: 'product_name',
      header: 'Product Name',
      render: (m) => <span className="font-medium text-forest">{m.product_name}</span>,
    },
    {
      key: 'movement_type',
      header: 'Type',
      render: (m) => {
        if (m.movement_type === 'IN') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-mint-primary text-forest-dark border border-mint">
              <ArrowDownRight className="w-3 h-3 text-forest-dark" /> IN (Restock)
            </span>
          );
        }
        if (m.movement_type === 'OUT') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-forest text-mint-primary border border-forest">
              <ArrowUpRight className="w-3 h-3 text-mint-primary" /> OUT (Order)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-forest-surface text-forest border border-forest-border">
            <RefreshCw className="w-3 h-3 text-forest" /> ADJUST (Audit)
          </span>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Qty Change',
      className: 'text-right tabular-nums font-medium',
      render: (m) => (
        <span className={m.quantity > 0 ? 'text-forest-dark font-bold' : 'text-forest'}>
          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
        </span>
      ),
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      className: 'text-right tabular-nums font-medium text-forest-dark',
    },
    {
      key: 'reason',
      header: 'Audit Reason / Reference',
      render: (m) => (
        <span className="text-xs text-forest-muted">
          {m.reason || (m.reference_order_id ? `Order #${m.reference_order_id}` : '-')}
        </span>
      ),
    },
  ];

  const lowStockColumns: Column<LowStockAlert>[] = [
    {
      key: 'sku',
      header: 'SKU',
      className: 'font-mono text-[11px] font-medium text-forest',
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (item) => <span className="font-medium text-forest">{item.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <span className="px-2 py-0.5 rounded-full bg-forest-surface text-forest-muted text-[11px]">
          {item.category || 'General'}
        </span>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'Current Stock',
      className: 'tabular-nums font-bold text-forest text-right',
    },
    {
      key: 'reorder_level',
      header: 'Reorder Level',
      className: 'tabular-nums text-forest-muted text-right',
    },
    {
      key: 'shortage',
      header: 'Deficit / Shortage',
      className: 'tabular-nums text-forest font-bold text-right',
      render: (item) => (
        <span className="px-2 py-0.5 rounded-full bg-forest-surface text-forest border border-forest-border font-medium">
          -{item.shortage} units
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory & Stock Ledger"
        subtitle="Immutable stock movement records, audit balances, and proactive reorder alerts."
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-forest-border pb-3">
        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'movements'
              ? 'bg-mint-primary text-forest-dark shadow-flat'
              : 'text-forest-muted hover:text-forest hover:bg-forest-surface'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Movement Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('low-stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
            activeTab === 'low-stock'
              ? 'bg-mint-primary text-forest-dark shadow-flat'
              : 'text-forest-muted hover:text-forest hover:bg-forest-surface'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Alerts ({lowStockData?.length || 0})</span>
        </button>
      </div>

      {activeTab === 'movements' ? (
        <DataTable
          columns={movementColumns}
          data={movementsData?.items}
          total={movementsData?.total}
          page={page}
          pageSize={20}
          totalPages={movementsData?.total_pages}
          isLoading={isLoadingMovements}
          onPageChange={setPage}
          filters={
            <select
              value={movementFilter}
              onChange={(e) => {
                setMovementFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-forest-border bg-white text-forest focus:outline-none"
            >
              <option value="">All Movement Types</option>
              <option value="IN">IN (Warehouse Restock)</option>
              <option value="OUT">OUT (Order Fulfillment)</option>
              <option value="ADJUST">ADJUST (Inventory Audit)</option>
            </select>
          }
        />
      ) : (
        <DataTable
          columns={lowStockColumns}
          data={lowStockData}
          total={lowStockData?.length || 0}
          isLoading={isLoadingLowStock}
          emptyTitle="All stock levels optimal"
          emptyDescription="There are currently no products at or below their configured reorder threshold."
        />
      )}
    </div>
  );
};
