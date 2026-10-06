import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { SalesTrendPoint } from '../../types/dashboard';
import { formatCurrency, formatCompactCurrency } from '../../lib/utils';
import { DashboardCard } from './DashboardCard';
import { useThemeColors } from '../../theme/ThemeProvider';

interface SalesTrendChartProps {
  data: SalesTrendPoint[];
  rangeDays: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  rangeDays,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const colors = useThemeColors();
  const step = Math.max(1, Math.floor(data.length / 6));

  const chartData = data.map((item) => ({
    ...item,
    revenue: Number(item.revenue || 0),
    previous_revenue: Number(item.previous_revenue || 0),
  }));

  const isEmpty =
    chartData.length === 0 ||
    chartData.every((item) => item.revenue === 0 && item.previous_revenue === 0);

  return (
    <DashboardCard
      title={`Sales Trend (${rangeDays} Days)`}
      subtitle="Current period revenue vs previous period"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No sales in this range"
      emptyHint="Try selecting a wider date range to view revenue trend."
      action={
        <div className="flex items-center gap-3 text-caption">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: colors.chart1 }}
            />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-0.5 border-t-2 border-dashed inline-block"
              style={{ borderColor: colors.textMuted }}
            />
            Previous
          </span>
        </div>
      }
    >
      <div className="w-full h-[220px] shrink-0">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="mintAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.chart1} stopOpacity={0.4} />
                <stop offset="100%" stopColor={colors.chart1} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tick={{ fontSize: 10, fill: colors.textMuted }}
              interval={step}
              tickFormatter={(val) => {
                if (!val) return '';
                const parts = val.split('-');
                return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tick={{ fontSize: 10, fill: colors.textMuted }}
              tickFormatter={(val) => formatCompactCurrency(val)}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as SalesTrendPoint;
                  return (
                    <div className="bg-surface border border-border p-2.5 rounded-input shadow-card text-caption">
                      <p className="text-body">{item.date}</p>
                      <p className="text-text mt-1">
                        Current: {formatCurrency(item.revenue)}
                      </p>
                      <p className="text-muted font-normal">
                        Previous: {formatCurrency(item.previous_revenue)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={colors.chart1}
              strokeWidth={2}
              fill="url(#mintAreaGrad)"
            />
            <Line
              type="monotone"
              dataKey="previous_revenue"
              stroke={colors.chart4}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};
