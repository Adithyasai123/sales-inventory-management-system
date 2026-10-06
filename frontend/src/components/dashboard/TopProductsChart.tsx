import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TopSellingProduct } from '../../types/dashboard';
import { formatCurrency, cn } from '../../lib/utils';
import { DashboardCard } from './DashboardCard';
import { Skeleton } from '../ui/Skeleton';
import { useThemeColors } from '../../theme/ThemeProvider';

interface TopProductsChartProps {
  data: TopSellingProduct[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const TopProductsChart: React.FC<TopProductsChartProps> = ({
  data,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const colors = useThemeColors();
  const chartData = data.slice(0, 5).map((item) => ({
    ...item,
    units_sold: Number(item.units_sold || 0),
    total_revenue: Number(item.total_revenue || 0),
  }));

  const isEmpty =
    chartData.length === 0 || chartData.every((item) => item.units_sold === 0);

  return (
    <DashboardCard
      title="Top Selling Products"
      subtitle="Highest volume from completed orders"
      isLoading={isLoading}
      loadingSkeleton={
        <div className="flex-1 flex flex-col justify-around py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`prod-bar-skel-${i}`} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className={cn('h-2.5 rounded-full', ['w-[85%]', 'w-[70%]', 'w-[55%]', 'w-[40%]', 'w-[25%]'][i])} />
            </div>
          ))}
        </div>
      }
      isError={isError}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No product sales in this range"
      emptyHint="Units sold from completed orders will appear here."
    >
      <div className="w-full h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tick={{ fontSize: 10, fill: colors.textMuted }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: colors.text }}
              width={100}
              tickFormatter={(val) =>
                val.length > 13 ? `${val.slice(0, 12)}…` : val
              }
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as TopSellingProduct;
                  return (
                    <div className="bg-surface border border-border p-2 rounded-input shadow-card text-caption">
                      <p className="text-subtitle">{item.name}</p>
                      <p className="text-caption font-mono text-muted">SKU: {item.sku}</p>
                      <p className="text-text mt-1">Units Sold: <span className="">{item.units_sold}</span></p>
                      <p className="text-text">Revenue: {formatCurrency(item.total_revenue)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="units_sold"
              fill={colors.chart1}
              radius={[0, 6, 6, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};
