import { useMutation } from '@tanstack/react-query';
import { runAudit } from '@/lib/api';

export function useAudit() {
  return useMutation({
    mutationFn: (url: string) => runAudit(url),
  });
}
