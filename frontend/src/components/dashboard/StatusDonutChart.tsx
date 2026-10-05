import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { OrderStatusCount } from '../../types/dashboard';
import { DashboardCard } from './DashboardCard';
import { useThemeColors } from '../../theme/ThemeProvider';

interface StatusDonutChartProps {
  data: OrderStatusCount[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  data,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const colors = useThemeColors();
  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return colors.chart1;
      case 'APPROVED':
        return colors.chart2;
      case 'PENDING_APPROVAL':
      case 'PENDING':
        return colors.primarySoft;
      case 'REJECTED':
        return colors.accent;
      case 'CANCELLED':
        return colors.textMuted;
      case 'DRAFT':
        return colors.surfaceAlt;
      default:
        return colors.chart4;
    }
  };

  return (
    <DashboardCard
      title="Orders by Status"
      subtitle="Lifetime order status distribution"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyMessage="No data for this range"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between h-[200px] gap-2 shrink-0">
        {/* Donut with center total */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
                paddingAngle={2}
                stroke="transparent"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStatusColor(entry.status)}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as OrderStatusCount;
                    const pct = totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : 0;
                    return (
                      <div className="bg-surface border border-border p-2 rounded-input shadow-card text-caption">
                        <span className="text-body">
                          {item.status.replace('_', ' ')}
                        </span>
                        : <span className="text-subtitle">{item.count}</span> ({pct}%)
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total inside Donut Hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-title text-text tabular-nums leading-none">
              {totalOrders}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Compact Legend */}
        <div className="flex-1 flex flex-col gap-1.5 w-full pl-2 overflow-y-auto max-h-[160px]">
          {data.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between text-caption py-0.5"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-border"
                  style={{ backgroundColor: getStatusColor(item.status) }}
                />
                <span className="truncate text-text text-[11px]">
                  {item.status.replace('_', ' ')}
                </span>
              </div>
              <span className="text-body text-[11px] tabular-nums shrink-0 pl-1">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};
