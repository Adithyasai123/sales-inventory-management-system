import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';

export function useUsers(params?: { page?: number; page_size?: number; role?: string; search?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
  });
}

export function useUserHierarchy() {
  return useQuery({
    queryKey: ['users-hierarchy'],
    queryFn: () => usersApi.getHierarchy(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['users', 'create'],
    mutationFn: (payload: any) => usersApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User "${data.email}" created successfully.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['users', 'update'],
    mutationFn: ({ id, payload }: { id: number; payload: any }) => usersApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User "${data.email}" updated successfully.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['users', 'delete'],
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully.');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
