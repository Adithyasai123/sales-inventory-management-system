import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api';
import { ProductInput, StockAdjustPayload } from '../types/product';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';

export function useProducts(params?: {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  is_low_stock?: boolean;
  is_active?: boolean;
  include_deleted?: boolean;
  sort_by?: string;
  sort_order?: string;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['products', 'create'],
    mutationFn: (payload: ProductInput) => productsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Product "${data.name}" created successfully.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['products', 'update'],
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ProductInput> }) =>
      productsApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      toast.success(`Product "${data.name}" updated successfully.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['products', 'delete'],
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product soft-deleted.');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['products', 'restore'],
    mutationFn: (id: number) => productsApi.restore(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Product "${data.name}" restored successfully.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['products', 'adjust-stock'],
    mutationFn: ({ id, payload }: { id: number; payload: StockAdjustPayload }) =>
      productsApi.adjustStock(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Stock adjusted for "${data.sku}". New Balance: ${data.stock_quantity}`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
