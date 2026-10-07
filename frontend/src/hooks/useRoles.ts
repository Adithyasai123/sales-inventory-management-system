import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../api';
import { RoleCreatePayload, RoleUpdatePayload } from '../types/auth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';

export function useRoles(params?: { search?: string }) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => rolesApi.list(params),
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RoleCreatePayload) => rolesApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(`Role "${data.display_name}" created successfully.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RoleUpdatePayload }) =>
      rolesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Role "${data.display_name}" updated successfully.`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(res.message || 'Role deleted successfully.');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
