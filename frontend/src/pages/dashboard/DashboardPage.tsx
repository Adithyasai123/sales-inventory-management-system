import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardSummary } from '../../hooks/useDashboard';
import { PageHeader } from '../../components/ui/PageHeader';
import { KpiCard } from '../../components/ui/KpiCard';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardSummary();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const kpis = data?.kpis;
  const salesTrend = data?.sales_trend || [];
  const statusDistribution = data?.status_distribution || [];
  const topProducts = data?.top_products || [];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Friendly MongoDB-style Greeting Header */}
      <PageHeader
        title={`${getGreeting()}, ${user?.full_name?.split(' ')[0] || 'Team'}!`}
        subtitle="Here is an overview of your sales revenue, pending approvals, and inventory balances."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/orders/create')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Sales Order
          </Button>
        }
      />

      {/* KPI Cards: First card is HERO in Mint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sales Revenue"
          value={formatCurrency(kpis?.total_sales_revenue)}
          subtitle="Fulfilled orders"
          icon={<DollarSign className="w-5 h-5" />}
          isHero={true}
          isLoading={isLoading}
        />

        <KpiCard
          title="Total Orders"
          value={kpis?.total_orders_count ?? 0}
          subtitle="Orders created to date"
          icon={<ShoppingCart className="w-5 h-5" />}
          isLoading={isLoading}
        />

        <KpiCard
          title="Pending Approvals"
          value={kpis?.pending_approvals_count ?? 0}
          subtitle="Requires manager review"
          icon={<Clock className="w-5 h-5" />}
          isLoading={isLoading}
          trend={
            (kpis?.pending_approvals_count ?? 0) > 0
              ? { value: 'Action Needed', isPositive: false }
              : undefined
          }
        />

        <KpiCard
          title="Low Stock Alerts"
          value={kpis?.low_stock_items_count ?? 0}
          subtitle="At or below reorder level"
          icon={<AlertTriangle className="w-5 h-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Main Analytics Row: 30-Day Sales Trend Bar Chart & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rounded-pill Bar Chart: Current day in Forest, others in Mint */}
        <div className="lg:col-span-2 bg-white rounded-card p-6 border border-forest-border shadow-flat flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg font-medium text-forest">
                Sales Trend (Last 30 Days)
              </h2>
              <p className="text-xs text-forest-muted">
                Daily fulfilled order revenue. Current day highlighted in Forest ink.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-forest-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-mint-primary border border-mint inline-block" />
                Previous Days
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-forest border border-forest inline-block" />
                Today
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#CFE7DC' }}
                  tick={{ fontSize: 10, fill: '#5B7A73' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#CFE7DC' }}
                  tick={{ fontSize: 10, fill: '#5B7A73' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  cursor={{ fill: '#F1FAF6' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-forest-border p-2.5 rounded-input shadow-flat text-xs">
                          <p className="font-serif font-medium text-forest">{item.date}</p>
                          <p className="text-forest-dark font-medium mt-1">
                            Revenue: {formatCurrency(item.revenue)}
                          </p>
                          <p className="text-forest-muted text-[11px]">
                            Orders: {item.orders_count}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {salesTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.date === todayStr ? '#0F2E2A' : '#BFEBD5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution Card */}
        <div className="bg-white rounded-card p-6 border border-forest-border shadow-flat flex flex-col">
          <h2 className="font-serif text-lg font-medium text-forest mb-1">
            Orders by Status
          </h2>
          <p className="text-xs text-forest-muted mb-4">
            Breakdown across all lifetime orders.
          </p>

          <div className="flex-1 flex flex-col justify-center gap-3">
            {statusDistribution.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between p-2.5 rounded-input bg-forest-surface/60 border border-forest-border/60"
              >
                <span className="text-xs font-medium text-forest">
                  {item.status.replace('_', ' ')}
                </span>
                <span className="font-serif text-sm font-medium tabular-nums text-forest-dark">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Top Selling Products */}
      <div className="bg-white rounded-card p-6 border border-forest-border shadow-flat">
        <h2 className="font-serif text-lg font-medium text-forest mb-1">
          Top Selling Products
        </h2>
        <p className="text-xs text-forest-muted mb-4">
          Highest volume products from completed orders.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-forest">
            <thead>
              <tr className="border-b border-forest-border bg-forest-surface/60 text-forest-muted font-medium uppercase text-[11px]">
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5">Product Name</th>
                <th className="px-4 py-2.5 text-right">Units Sold</th>
                <th className="px-4 py-2.5 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-border/40">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-forest-muted">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                topProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-forest-surface/40">
                    <td className="px-4 py-3 font-mono text-[11px] text-forest font-medium">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.units_sold}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-forest-dark">
                      {formatCurrency(p.total_revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
