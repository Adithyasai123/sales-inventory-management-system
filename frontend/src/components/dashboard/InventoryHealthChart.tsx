import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { InventoryHealthItem } from '../../types/dashboard';
import { DashboardCard } from './DashboardCard';
import { AlertTriangle } from 'lucide-react';
import { useThemeColors } from '../../theme/ThemeProvider';

interface InventoryHealthChartProps {
  data: InventoryHealthItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const InventoryHealthChart: React.FC<InventoryHealthChartProps> = ({
  data,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const colors = useThemeColors();
  const lowCount = data.filter((item) => item.is_low_stock).length;

  return (
    <DashboardCard
      title="Inventory Health"
      subtitle="Stock vs reorder level for 8 lowest-stock items"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      isEmpty={data.length === 0}
      emptyMessage="No data for this range"
      action={
        <div className="flex items-center gap-2">
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-subtitle bg-surfaceAlt px-2 py-0.5 rounded-full border border-border">
              <AlertTriangle className="w-3 h-3 text-warning" />
              {lowCount} Low Stock
            </span>
          )}
        </div>
      }
    >
      <div className="w-full h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            barGap={2}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tick={{ fontSize: 10, fill: colors.textMuted }}
              interval={0}
              tickFormatter={(val) => (val.length > 9 ? `${val.slice(0, 8)}…` : val)}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tick={{ fontSize: 10, fill: colors.textMuted }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as InventoryHealthItem;
                  return (
                    <div className="bg-surface border border-border p-2.5 rounded-input shadow-card text-caption">
                      <div className="flex items-center gap-1.5 text-subtitle">
                        {item.is_low_stock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                        )}
                        <span>{item.name}</span>
                      </div>
                      <p className="text-[11px] font-mono text-muted">SKU: {item.sku}</p>
                      <div className="mt-1.5 space-y-0.5">
                        <p className="flex justify-between gap-3 text-text">
                          <span>Current Stock:</span>
                          <span className="">{item.stock_quantity}</span>
                        </p>
                        <p className="flex justify-between gap-3 text-muted">
                          <span>Reorder Level:</span>
                          <span>{item.reorder_level}</span>
                        </p>
                        <p className="text-[10px] text-subtitle mt-1">
                          Status: {item.is_low_stock ? 'REORDER NEEDED' : 'HEALTHY'}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Reorder level reference bar */}
            <Bar
              dataKey="reorder_level"
              name="Reorder Level"
              fill={colors.surfaceAlt}
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
            {/* Current stock bar: slate/accent if low stock, mint-400 if healthy */}
            <Bar
              dataKey="stock_quantity"
              name="Stock Quantity"
              radius={[4, 4, 0, 0]}
              barSize={12}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.is_low_stock ? colors.accent : colors.chart2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-5 text-caption pt-1 border-t border-border shrink-0">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-xs inline-block"
            style={{ backgroundColor: colors.accent }}
          />
          Low Stock (Needs Reorder)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-xs inline-block"
            style={{ backgroundColor: colors.chart2 }}
          />
          Adequate Stock
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-xs inline-block"
            style={{ backgroundColor: colors.surfaceAlt }}
          />
          Reorder Threshold
        </span>
      </div>
    </DashboardCard>
  );
};
