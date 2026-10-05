import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api';
import { CreateOrderPayload, OrderStatus } from '../types/order';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';

export function useOrders(params?: {
  page?: number;
  page_size?: number;
  status?: OrderStatus;
  customer_id?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.list(params),
  });
}

export function useOrder(id: number | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (data.requires_approval) {
        toast.success(`Order ${data.order_number} submitted! Awaiting Manager approval.`);
      } else {
        toast.success(`Order ${data.order_number} auto-confirmed and completed!`);
      }
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
      toast.success(`Order ${data.order_number} cancelled.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
