import React, { useState } from 'react';
import { useInventoryMovements, useLowStockAlerts } from '../../hooks/useInventory';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, Column } from '../../components/ui/DataTable';
import { InventoryMovement, LowStockAlert, MovementType } from '../../types/inventory';
import { formatDate } from '../../lib/utils';
import { Layers, AlertTriangle, ArrowDownRight, ArrowUpRight, RefreshCw, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { inventoryApi } from '../../api';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movements' | 'low-stock'>('movements');
  const [page, setPage] = useState(1);
  const [movementFilter, setMovementFilter] = useState<MovementType | ''>('');

  const { data: movementsData, isLoading: isLoadingMovements } = useInventoryMovements({
    page,
    page_size: 15,
    movement_type: (movementFilter as MovementType) || undefined,
  });

  const { data: lowStockData, isLoading: isLoadingLowStock } = useLowStockAlerts();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await inventoryApi.exportMovementsCsv({
        movement_type: (movementFilter as MovementType) || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_movements_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const movementColumns: Column<InventoryMovement>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      width: '160px',
      className: 'text-muted text-[11px]',
      render: (m) => formatDate(m.created_at),
    },
    {
      key: 'product_sku',
      header: 'SKU',
      width: '130px',
      className: 'font-mono text-[11px] text-body font-medium',
    },
    {
      key: 'product_name',
      header: 'Product Name',
      width: '260px',
      render: (m) => <span className="text-body font-medium">{m.product_name}</span>,
    },
    {
      key: 'movement_type',
      header: 'Type',
      width: '160px',
      render: (m) => {
        if (m.movement_type === 'IN') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <ArrowDownRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> IN (Restock)
            </span>
          );
        }
        if (m.movement_type === 'OUT') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              <ArrowUpRight className="w-3 h-3 text-blue-600 dark:text-blue-400" /> OUT (Order)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" /> ADJUST (Audit)
          </span>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Qty Change',
      width: '120px',
      className: 'text-right tabular-nums font-semibold',
      render: (m) => (
        <span className={m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
        </span>
      ),
    },
    {
      key: 'balance_after',
      header: 'Balance After',
      width: '130px',
      className: 'text-right tabular-nums text-body font-medium',
    },
    {
      key: 'reason',
      header: 'Audit Reason / Reference',
      width: '220px',
      render: (m) => (
        <span className="text-caption text-muted">
          {m.reason || (m.reference_order_id ? `Order #${m.reference_order_id}` : '-')}
        </span>
      ),
    },
  ];

  const lowStockColumns: Column<LowStockAlert>[] = [
    {
      key: 'sku',
      header: 'SKU',
      width: '140px',
      className: 'font-mono text-[11px] text-body font-medium',
    },
    {
      key: 'name',
      header: 'Product Name',
      width: '280px',
      render: (item) => <span className="text-body font-medium">{item.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      width: '140px',
      render: (item) => (
        <span className="px-2 py-0.5 rounded-full bg-surfaceAlt text-muted text-[11px] border border-border">
          {item.category || 'General'}
        </span>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'Current Stock',
      width: '140px',
      className: 'tabular-nums text-text font-semibold text-right',
    },
    {
      key: 'reorder_level',
      header: 'Reorder Level',
      width: '140px',
      className: 'tabular-nums text-muted text-right',
    },
    {
      key: 'shortage',
      header: 'Deficit / Shortage',
      width: '160px',
      className: 'tabular-nums text-right',
      render: (item) => (
        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold">
          -{item.shortage} units
        </span>
      ),
    },
  ];

  const tabs = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setActiveTab('movements')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-caption font-semibold transition-colors ${
          activeTab === 'movements'
            ? 'bg-accent text-accentText shadow-card'
            : 'text-muted hover:text-text hover:bg-surfaceAlt'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Movement Ledger</span>
      </button>

      <button
        onClick={() => setActiveTab('low-stock')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-caption font-semibold transition-colors ${
          activeTab === 'low-stock'
            ? 'bg-accent text-accentText shadow-card'
            : 'text-muted hover:text-text hover:bg-surfaceAlt'
        }`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Low Stock Alerts ({lowStockData?.length || 0})</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Inventory & Stock Ledger"
        subtitle="Immutable stock movement records, audit balances, and proactive reorder alerts."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Ledger CSV
          </Button>
        }
      />

      {activeTab === 'movements' ? (
        <DataTable
          leftContent={tabs}
          columns={movementColumns}
          data={movementsData?.items}
          total={movementsData?.total}
          page={page}
          pageSize={15}
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
              className="px-3 py-1.5 rounded-full text-caption border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-chart1"
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
          leftContent={tabs}
          columns={lowStockColumns}
          data={lowStockData}
          total={lowStockData?.length || 0}
          isLoading={isLoadingLowStock}
          emptyAnimation="success"
          emptyTitle="Stock levels look healthy"
          emptyDescription="There are currently no products at or below their configured reorder threshold."
        />
      )}
    </div>
  );
};
