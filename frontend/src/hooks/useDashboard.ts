import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';

export function useDashboardSummary(range: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'summary', range],
    queryFn: () => dashboardApi.getSummary(range),
  });
}

export function useTopCustomers(range: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'top-customers', range],
    queryFn: () => dashboardApi.getTopCustomers(range),
  });
}

export function useInventoryHealth(range: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'inventory-health', range],
    queryFn: () => dashboardApi.getInventoryHealth(range),
  });
}

export function useApprovalStats(range: number = 30) {
  return useQuery({
    queryKey: ['dashboard', 'approval-stats', range],
    queryFn: () => dashboardApi.getApprovalStats(range),
  });
}

export function useMovementsTrend(range: number = 14) {
  return useQuery({
    queryKey: ['dashboard', 'movements-trend', range],
    queryFn: () => dashboardApi.getMovementsTrend(range),
  });
}
