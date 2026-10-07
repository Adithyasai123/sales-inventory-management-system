import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api';
import { ThresholdUpdatePayload } from '../types/setting';
import toast from 'react-hot-toast';
import { getErrorMessage, formatCurrency, setGlobalCurrencyConfig } from '../lib/utils';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const settings = await settingsApi.getAll();
      const codeSetting = settings.find((s) => s.key === 'currency_code');
      const localeSetting = settings.find((s) => s.key === 'currency_locale');
      if (codeSetting || localeSetting) {
        setGlobalCurrencyConfig({
          code: codeSetting?.value || 'INR',
          locale: localeSetting?.value || 'en-IN',
        });
      }
      return settings;
    },
  });
}

export function useUpdateThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['settings', 'update'],
    mutationFn: (payload: ThresholdUpdatePayload) => settingsApi.updateThreshold(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(`Approval threshold updated to ${formatCurrency(data.value)}`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });
}
