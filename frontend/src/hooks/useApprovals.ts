import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '../api';
import { ApprovalActionPayload } from '../types/approval';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';

export function usePendingApprovals(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['approvals', 'pending', params],
    queryFn: () => approvalsApi.listPending(params),
  });
}

export function useSubmitApprovalAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['approvals', 'submit'],
    mutationFn: ({ id, payload }: { id: number; payload: ApprovalActionPayload }) =>
      approvalsApi.submitAction(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      if (variables.payload.decision === 'APPROVED') {
        toast.success(`Order ${data.order_number} approved! Inventory has been updated.`);
      } else {
        toast.success(`Order ${data.order_number} rejected.`);
      }
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
