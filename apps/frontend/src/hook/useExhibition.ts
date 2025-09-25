import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetchExhibitionById } from "../api/exhibitions";
import type { Exhibition } from "../types/exhibition";

type Opts = Omit<UseQueryOptions<Exhibition, Error>, "queryKey" | "queryFn">;

export function useExhibition(id?: string | number, opts?: Opts) {
  return useQuery<Exhibition, Error>({
    queryKey: ["exhibition", id],
    queryFn: () => fetchExhibitionById(id as string | number),
    enabled: !!id && (opts?.enabled ?? true), // ไม่มี id = ไม่ยิง
    ...opts,
  });
}
