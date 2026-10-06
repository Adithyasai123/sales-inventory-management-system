import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { MovementTrendPoint } from '../../types/dashboard';
import { DashboardCard } from './DashboardCard';
import { useThemeColors } from '../../theme/ThemeProvider';

interface MovementsTrendChartProps {
  data: MovementTrendPoint[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const MovementsTrendChart: React.FC<MovementsTrendChartProps> = ({
  data,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const colors = useThemeColors();

  const isEmpty =
    data.length === 0 || data.every((m) => m.in_qty === 0 && m.out_qty === 0);

  return (
    <DashboardCard
      title="Stock Movements"
      subtitle="Stacked IN (received) vs OUT (dispatched) per day"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyMessage="No stock movements in this range"
      emptyHint="Inventory restocks, orders, and audits will appear here."
      action={
        <div className="flex items-center gap-3 text-caption">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: colors.chart2 }}
            />
            Stock IN
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: colors.accent }}
            />
            Stock OUT
          </span>
        </div>
      }
    >
      <div className="w-full h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tick={{ fontSize: 10, fill: colors.textMuted }}
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
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MovementTrendPoint;
                  return (
                    <div className="bg-surface border border-border p-2.5 rounded-input shadow-card text-caption">
                      <p className="text-body">{item.date}</p>
                      <p className="text-text mt-1 flex justify-between gap-4">
                        <span>Stock IN:</span>
                        <span className="text-subtitle">+{item.in_qty}</span>
                      </p>
                      <p className="text-text flex justify-between gap-4">
                        <span>Stock OUT:</span>
                        <span className="text-subtitle">-{item.out_qty}</span>
                      </p>
                      <p className="text-caption mt-1 border-t border-border pt-1">
                        Net: {item.in_qty - item.out_qty > 0 ? `+${item.in_qty - item.out_qty}` : item.in_qty - item.out_qty}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="in_qty"
              name="Stock IN"
              stackId="movements"
              fill={colors.chart2}
              radius={[0, 0, 0, 0]}
              barSize={14}
            />
            <Bar
              dataKey="out_qty"
              name="Stock OUT"
              stackId="movements"
              fill={colors.accent}
              radius={[4, 4, 0, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};
