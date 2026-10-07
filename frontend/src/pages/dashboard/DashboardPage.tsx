import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  useDashboardSummary,
  useTopCustomers,
  useInventoryHealth,
  useApprovalStats,
  useMovementsTrend,
} from '../../hooks/useDashboard';
import { useOrders } from '../../hooks/useOrders';
import { usePendingApprovals } from '../../hooks/useApprovals';

import { StatStrip } from '../../components/dashboard/StatStrip';
import { SalesTrendChart } from '../../components/dashboard/SalesTrendChart';
import { StatusDonutChart } from '../../components/dashboard/StatusDonutChart';
import { TopProductsChart } from '../../components/dashboard/TopProductsChart';
import { TopCustomersChart } from '../../components/dashboard/TopCustomersChart';
import { ApprovalFunnelCard } from '../../components/dashboard/ApprovalFunnelCard';
import { InventoryHealthChart } from '../../components/dashboard/InventoryHealthChart';
import { MovementsTrendChart } from '../../components/dashboard/MovementsTrendChart';
import { RecentOrdersTable } from '../../components/dashboard/RecentOrdersTable';
import { PendingApprovalsCard } from '../../components/dashboard/PendingApprovalsCard';
import { DateRangePicker, DateRange } from '../../components/ui/DateRangePicker';
import { Button } from '../../components/ui/Button';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DashboardPage: React.FC = () => {
  const { user, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Custom Date Range State matching Untitled UI design (Image 2)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      startDate: start,
      endDate: end,
      label: 'This month',
      days: 30,
    };
  });

  const range = dateRange.days;

  // Can user see and act on pending approvals?
  const canApprove = isManager || isAdmin;

  // Analytics & Summary Queries
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useDashboardSummary(range);

  const {
    data: topCustomersData = [],
    isLoading: isCustomersLoading,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useTopCustomers(range);

  const {
    data: inventoryHealthData = [],
    isLoading: isInventoryLoading,
    isError: isInventoryError,
    refetch: refetchInventory,
  } = useInventoryHealth(range);

  const {
    data: approvalStatsData,
    isLoading: isApprovalsLoading,
    isError: isApprovalsError,
    refetch: refetchApprovals,
  } = useApprovalStats(range);

  const {
    data: movementsData = [],
    isLoading: isMovementsLoading,
    isError: isMovementsError,
    refetch: refetchMovements,
  } = useMovementsTrend(range);

  // Recent Orders Query (Compact 6 rows)
  const {
    data: recentOrdersData,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useOrders({ page: 1, page_size: 6, sort_by: 'created_at', sort_order: 'desc' });

  // Pending Approvals Query (Top 3 pending)
  const {
    data: pendingApprovalsData,
    isLoading: isPendingLoading,
    isError: isPendingError,
    refetch: refetchPending,
  } = usePendingApprovals({ page: 1, page_size: 3 });

  const cleanName = (user?.full_name || 'User').replace(/\s*\([^)]*\)/g, '').trim();


  return (
    <div className="flex flex-col gap-6">
      {/* 1. Clean Non-sticky Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-display">Dashboard</h1>
          <p className="text-caption mt-0.5">
            Real-time sales velocity, inventory health, and operational overview for {cleanName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Live syncing indicator */}
          {isSummaryLoading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surfaceAlt border border-border text-[11px] text-muted animate-fadeIn select-none">
              <Loader2 className="w-3 h-3 animate-spin text-accent" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          )}

          {/* Custom Date Range Picker Dropdown (Untitled UI design) */}
          <DateRangePicker
            value={dateRange}
            onChange={(newRange) => setDateRange(newRange)}
          />

          {/* Create Sales Order CTA */}
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/orders/create')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* 2. ONE Compact Stat Strip (6 tiles in single row on desktop, 2 rows on tablet) */}
      <StatStrip
        kpis={summaryData?.kpis}
        isLoading={isSummaryLoading}
        rangeDays={range}
      />

      {/* 3. Charts Grid (12-col on >=1280px, 6-col on tablet, 1-col on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-4">
        {/* a. Sales Trend (span 8) */}
        <div className="col-span-1 md:col-span-6 xl:col-span-8">
          <SalesTrendChart
            data={summaryData?.sales_trend || []}
            rangeDays={range}
            isLoading={isSummaryLoading}
            isError={isSummaryError}
            onRetry={refetchSummary}
          />
        </div>

        {/* b. Orders by Status (span 4) */}
        <div className="col-span-1 md:col-span-6 xl:col-span-4">
          <StatusDonutChart
            data={summaryData?.status_distribution || []}
            isLoading={isSummaryLoading}
            isError={isSummaryError}
            onRetry={refetchSummary}
          />
        </div>

        {/* c. Top Selling Products (span 4) */}
        <div className="col-span-1 md:col-span-3 xl:col-span-4">
          <TopProductsChart
            data={summaryData?.top_products || []}
            isLoading={isSummaryLoading}
            isError={isSummaryError}
            onRetry={refetchSummary}
          />
        </div>

        {/* d. Top Customers by Revenue (span 4) */}
        <div className="col-span-1 md:col-span-3 xl:col-span-4">
          <TopCustomersChart
            data={topCustomersData}
            isLoading={isCustomersLoading}
            isError={isCustomersError}
            onRetry={refetchCustomers}
          />
        </div>

        {/* e. Approval Funnel / Turnaround (span 4) */}
        <div className="col-span-1 md:col-span-6 xl:col-span-4">
          <ApprovalFunnelCard
            data={approvalStatsData}
            isLoading={isApprovalsLoading}
            isError={isApprovalsError}
            onRetry={refetchApprovals}
          />
        </div>

        {/* f. Inventory Health (span 6) */}
        <div className="col-span-1 md:col-span-3 xl:col-span-6">
          <InventoryHealthChart
            data={inventoryHealthData}
            isLoading={isInventoryLoading}
            isError={isInventoryError}
            onRetry={refetchInventory}
          />
        </div>

        {/* g. Stock Movements (span 6) */}
        <div className="col-span-1 md:col-span-3 xl:col-span-6">
          <MovementsTrendChart
            data={movementsData}
            isLoading={isMovementsLoading}
            isError={isMovementsError}
            onRetry={refetchMovements}
          />
        </div>

        {/* h. Recent Orders (span 8 if pending approvals shown, span 12 otherwise) */}
        <div
          className={cn(
            'col-span-1 md:col-span-6',
            canApprove ? 'xl:col-span-8' : 'xl:col-span-12'
          )}
        >
          <RecentOrdersTable
            orders={recentOrdersData?.items || []}
            isLoading={isOrdersLoading}
            isError={isOrdersError}
            onRetry={refetchOrders}
          />
        </div>

        {/* i. Pending Approvals (span 4, shown only for MANAGER/ADMIN, otherwise hidden and others reflow) */}
        {canApprove && (
          <div className="col-span-1 md:col-span-6 xl:col-span-4">
            <PendingApprovalsCard
              orders={pendingApprovalsData?.items || []}
              isLoading={isPendingLoading}
              isError={isPendingError}
              onRetry={refetchPending}
            />
          </div>
        )}
      </div>
    </div>
  );
};
