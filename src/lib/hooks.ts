'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchool } from './school';
export function useApi<T>(path: string | null, opts: { refetchInterval?: number } = {}) {
  const { api, school } = useSchool();
  return useQuery<T>({ queryKey: [school?.schoolCode, path], queryFn: () => api<T>(path!), enabled: !!school && !!path, refetchInterval: opts.refetchInterval });
}
export function useApiMutation<V = any, R = any>(fn: (v: V, api: ReturnType<typeof useSchool>['api']) => Promise<R>, invalidate: string[] = []) {
  const { api, school } = useSchool(); const qc = useQueryClient();
  return useMutation<R, Error, V>({ mutationFn: v => fn(v, api), onSuccess: () => invalidate.forEach(p => qc.invalidateQueries({ queryKey: [school?.schoolCode, p] })) });
}
