import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api';
import { ThresholdUpdatePayload } from '../types/setting';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../lib/utils';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll(),
  });
}

export function useUpdateThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ThresholdUpdatePayload) => settingsApi.updateThreshold(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(`Approval threshold updated to ₹${parseFloat(data.value).toLocaleString('en-IN')}`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
