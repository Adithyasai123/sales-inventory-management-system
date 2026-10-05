import React from 'react';
import { DashboardKPISummary } from '../../types/dashboard';
import { formatCompactCurrency, cn } from '../../lib/utils';
import { Sparkline } from '../ui/Sparkline';
import { Skeleton } from '../ui/Skeleton';
import { useThemeColors } from '../../theme/ThemeProvider';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatStripProps {
  kpis?: DashboardKPISummary;
  isLoading?: boolean;
  rangeDays?: number;
}

export const StatStrip: React.FC<StatStripProps> = ({
  kpis,
  isLoading = false,
  rangeDays = 30,
}) => {
  const colors = useThemeColors();

  const renderDelta = (delta?: number, isRevenueTile = false) => {
    if (delta === undefined || delta === null) return null;
    const isZero = Math.abs(delta) < 0.1;
    const isPositive = delta > 0;

    return (
      <span
        className={cn(
          'inline-flex items-center text-[10px]  tabular-nums leading-none',
          isRevenueTile ? 'text-primaryText/85' : 'text-muted'
        )}
      >
        {isZero ? (
          <Minus className="w-2.5 h-2.5 mr-0.5" />
        ) : isPositive ? (
          <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
        ) : (
          <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
        )}
        <span>{delta > 0 ? `+${delta}%` : `${delta}%`}</span>
      </span>
    );
  };

  const tiles = [
    {
      id: 'revenue',
      label: 'Revenue',
      value: formatCompactCurrency(kpis?.total_sales_revenue || 0),
      delta: kpis?.revenue_delta,
      sparkline: kpis?.revenue_sparkline,
      isRevenue: true,
      bgClass: 'bg-primary text-primaryText border-primary/50',
    },
    {
      id: 'orders',
      label: 'Orders',
      value: (kpis?.total_orders_count ?? 0).toLocaleString(),
      delta: kpis?.orders_delta,
      sparkline: kpis?.orders_sparkline,
      isRevenue: false,
      bgClass: 'bg-surface text-text border-border',
    },
    {
      id: 'aov',
      label: 'Avg Order Value',
      value: formatCompactCurrency(kpis?.avg_order_value || 0),
      delta: kpis?.avg_order_value_delta,
      sparkline: kpis?.avg_order_value_sparkline,
      isRevenue: false,
      bgClass: 'bg-surfaceAlt text-text border-border',
    },
    {
      id: 'pending',
      label: 'Pending Approvals',
      value: (kpis?.pending_approvals_count ?? 0).toLocaleString(),
      delta: kpis?.pending_approvals_delta,
      sparkline: kpis?.pending_approvals_sparkline,
      isRevenue: false,
      bgClass: 'bg-surface text-text border-border',
    },
    {
      id: 'low_stock',
      label: 'Low Stock',
      value: (kpis?.low_stock_items_count ?? 0).toLocaleString(),
      delta: kpis?.low_stock_delta,
      sparkline: kpis?.low_stock_sparkline,
      isRevenue: false,
      bgClass: 'bg-surfaceAlt text-text border-border',
    },
    {
      id: 'inv_val',
      label: 'Inventory Value',
      value: formatCompactCurrency(kpis?.inventory_value || 0),
      delta: kpis?.inventory_value_delta,
      sparkline: kpis?.inventory_value_sparkline,
      isRevenue: false,
      bgClass: 'bg-surface text-text border-border',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 select-none">
      {tiles.map((tile) => (
        <div
          key={tile.id}
          className={cn(
            'h-[82px] rounded-card border p-3 flex items-center justify-between gap-2 shadow-card transition-all duration-150',
            tile.bgClass
          )}
        >
          {/* Left stats column */}
          <div className="flex flex-col justify-between h-full min-w-0 flex-1">
            <span
              className={cn(
                'text-[11px] font-medium tracking-tight truncate',
                tile.isRevenue ? 'text-primaryText/90' : 'text-muted'
              )}
            >
              {tile.label}
            </span>

            {isLoading ? (
              <Skeleton className="h-6 w-20 my-0.5" />
            ) : (
              <div className="text-[20px] sm:text-[22px] font-bold leading-[26px] tabular-nums truncate">
                {tile.value}
              </div>
            )}

            <div className="flex items-center gap-1">
              {renderDelta(tile.delta, tile.isRevenue)}
              <span
                className={cn(
                  'text-[10px] leading-none truncate',
                  tile.isRevenue ? 'text-primaryText' : 'text-muted'
                )}
              >
                vs prev {rangeDays}d
              </span>
            </div>
          </div>

          {/* Right 40px sparkline */}
          <div className="h-[40px] w-[50px] sm:w-[60px] flex items-center justify-center shrink-0">
            {isLoading ? (
              <Skeleton className="h-8 w-12 rounded-xs" />
            ) : (
              <Sparkline
                data={tile.sparkline}
                width={56}
                height={36}
                strokeColor={tile.isRevenue ? colors.primaryText : colors.chart1}
                fillColor={tile.isRevenue ? colors.primarySoft : colors.chart2}
                strokeWidth={1.5}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
