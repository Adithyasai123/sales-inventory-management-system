import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TopCustomer } from '../../types/dashboard';
import { formatCurrency } from '../../lib/utils';
import { DashboardCard } from './DashboardCard';
import { useThemeColors } from '../../theme/ThemeProvider';

interface TopCustomersChartProps {
  data: TopCustomer[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const TopCustomersChart: React.FC<TopCustomersChartProps> = ({
  data,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const colors = useThemeColors();
  const chartData = data.slice(0, 5).map((item) => ({
    ...item,
    orders_count: Number(item.orders_count || 0),
    total_revenue: Number(item.total_revenue || 0),
  }));

  return (
    <DashboardCard
      title="Top Customers by Revenue"
      subtitle="Highest revenue generated across orders"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={chartData.length === 0}
      emptyMessage="No data for this range"
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
              tickFormatter={(val) => {
                if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                return `₹${val}`;
              }}
            />
            <YAxis
              type="category"
              dataKey="customer_name"
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
                  const item = payload[0].payload as TopCustomer;
                  return (
                    <div className="bg-surface border border-border p-2 rounded-input shadow-card text-caption">
                      <p className="text-subtitle">{item.customer_name}</p>
                      <p className="text-text mt-1">
                        Total Revenue: {formatCurrency(item.total_revenue)}
                      </p>
                      <p className="text-muted text-[11px]">
                        Orders: {item.orders_count}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="total_revenue"
              fill={colors.accent}
              radius={[0, 6, 6, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};
