import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchUnit } from "../api/units";
import type { Unit } from "../types/units";

type Opts = Omit<UseQueryOptions<Unit, Error>, "queryKey" | "queryFn">;

export function useUnit(
  exhibitionId?: string | number,
  unitId?: string | number,
  opts?: Opts,
) {
  const enabled = Boolean(exhibitionId && unitId) && (opts?.enabled ?? true);

  return useQuery<Unit, Error>({
    queryKey: ["unit", exhibitionId, unitId],
    queryFn: () => fetchUnit(exhibitionId as string | number, unitId as string | number),
    enabled,
    ...opts,
  });
}
