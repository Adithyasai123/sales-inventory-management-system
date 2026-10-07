import React from 'react';
import { Skeleton } from '../ui/Skeleton';

interface OrderReviewDrawerSkeletonProps {
  showActionsStrip?: boolean;
  showCustomerInfo?: boolean;
  showApprovalTrail?: boolean;
  showManagerActions?: boolean;
}

export const OrderReviewDrawerSkeleton: React.FC<OrderReviewDrawerSkeletonProps> = ({
  showActionsStrip = true,
  showCustomerInfo = true,
  showApprovalTrail = true,
  showManagerActions = false,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn select-none">
      {/* Top Status & Customer Overview */}
      <div className="p-4 rounded-card bg-surfaceAlt border border-border flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12 rounded" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="text-right space-y-1.5 flex flex-col items-end">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-6 w-28 rounded" />
        </div>
      </div>

      {/* Quick Actions / Tax Doc Strip */}
      {showActionsStrip && (
        <div className="flex items-center justify-between p-3 rounded-card bg-surfaceAlt/50 border border-border">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      )}

      {/* Customer Information */}
      {showCustomerInfo && (
        <div>
          <Skeleton className="h-3 w-36 rounded mb-2" />
          <div className="p-3.5 rounded-input bg-surfaceAlt/60 border border-border flex flex-col gap-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3.5 w-40 rounded" />
            <Skeleton className="h-3.5 w-52 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
        </div>
      )}

      {/* Order Line Items */}
      <div>
        <Skeleton className="h-3 w-32 rounded mb-2" />
        <div className="border border-border rounded-input overflow-hidden">
          <div className="bg-surfaceAlt border-b border-border px-3 py-2 flex items-center justify-between">
            <Skeleton className="h-3 w-12 rounded" />
            <div className="flex items-center gap-6">
              <Skeleton className="h-3 w-8 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="p-3 flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-2.5 w-24 rounded font-mono" />
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="h-3.5 w-6 rounded ml-auto" />
                  <Skeleton className="h-3.5 w-16 rounded ml-auto" />
                  <Skeleton className="h-3.5 w-20 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="p-4 rounded-card bg-surfaceAlt border border-border flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3.5 w-16 rounded" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-3.5 w-16 rounded" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
      </div>

      {/* Approval Audit Trail */}
      {showApprovalTrail && (
        <div>
          <Skeleton className="h-3 w-36 rounded mb-2" />
          <div className="p-3 rounded-input bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-10 w-full rounded-input" />
          </div>
        </div>
      )}

      {/* Manager Decision Action Buttons */}
      {showManagerActions && (
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      )}
    </div>
  );
};
