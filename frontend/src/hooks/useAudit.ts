import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api';

export function useEmailLogs(status?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['audit-emails', status, limit],
    queryFn: () => auditApi.getEmails({ status: status || undefined, limit }),
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => auditApi.getStats(),
  });
}
