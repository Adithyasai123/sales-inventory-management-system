import React from 'react';
import { ApprovalStats } from '../../types/dashboard';
import { DashboardCard } from './DashboardCard';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ApprovalFunnelCardProps {
  data?: ApprovalStats;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const ApprovalFunnelCard: React.FC<ApprovalFunnelCardProps> = ({
  data,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const created = data?.created_count ?? 0;
  const pending = data?.pending_count ?? 0;
  const approved = data?.approved_count ?? 0;
  const rejected = data?.rejected_count ?? 0;
  const avgTime = data?.avg_decision_time_formatted || '1m';

  return (
    <DashboardCard
      title="Approval Funnel & Turnaround"
      subtitle="Lifecycle progression and review latency"
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      emptyMessage="No data for this range"
    >
      <div className="flex flex-col justify-between h-full gap-3 py-1">
        {/* Funnel Progress Steps */}
        <div className="grid grid-cols-3 gap-1.5 items-center">
          {/* Step 1: Created */}
          <div className="p-2 rounded-input bg-surfaceAlt border border-border flex flex-col items-center text-center">
            <span className="text-overline">Created</span>
            <span className="text-subtitle tabular-nums mt-0.5">
              {created}
            </span>
          </div>

          {/* Step 2: Pending */}
          <div className="p-2 rounded-input bg-surface border border-dashed border-primary flex flex-col items-center text-center">
            <span className="text-overline">Pending</span>
            <span className="text-subtitle tabular-nums mt-0.5">
              {pending}
            </span>
          </div>

          {/* Step 3: Decided (Approved / Rejected) */}
          <div className="p-2 rounded-input bg-primary/20 border border-primary/40 flex flex-col items-center text-center">
            <span className="text-overline">Decided</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-caption text-text tabular-nums flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                {approved}
              </span>
              <span className="text-caption">/</span>
              <span className="text-caption text-text tabular-nums flex items-center gap-0.5">
                <XCircle className="w-3 h-3 text-accent" />
                {rejected}
              </span>
            </div>
          </div>
        </div>

        {/* Turnaround Time Highlight Box */}
        <div className="flex items-center justify-between p-3 rounded-card bg-surfaceAlt border border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-surface border border-border text-text flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-text" />
            </div>
            <div>
              <p className="text-subtitle">Average Turnaround</p>
              <p className="text-caption">Order creation to manager decision</p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-primary text-primaryText text-btn tabular-nums shadow-card">
            {avgTime}
          </div>
        </div>

        {/* Summary note */}
        <div className="flex items-center justify-between text-caption px-1">
          <span>Resolution rate</span>
          <span className="text-body tabular-nums">
            {created > 0 ? `${Math.min(100, Math.round(((approved + rejected) / created) * 100))}%` : '100%'}
          </span>
        </div>
      </div>
    </DashboardCard>
  );
};
