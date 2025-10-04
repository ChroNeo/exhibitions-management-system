import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchUnits } from "../api/units";
import type { Unit } from "../types/units";

type Opts = Omit<UseQueryOptions<Unit[], Error>, "queryKey" | "queryFn">;

export function useUnits(exhibitionId?: string | number, opts?: Opts) {
  return useQuery<Unit[], Error>({
    queryKey: ["units", exhibitionId],
    queryFn: () => fetchUnits(exhibitionId as string | number),
    enabled: !!exhibitionId && (opts?.enabled ?? true),
    ...opts,
  });
}
