import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api';
import { MovementType } from '../types/inventory';

export function useInventoryMovements(params?: {
  page?: number;
  page_size?: number;
  product_id?: number;
  movement_type?: MovementType;
}) {
  return useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: () => inventoryApi.listMovements(params),
    refetchInterval: 5000,
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.getLowStockAlerts(),
    refetchInterval: 5000,
  });
}
