import { useQuery } from "@tanstack/react-query";
import { fetchExhibitionById } from "../api/exhibitions";
import type { Exhibition } from "../types/exhibition";

export function useExhibition(id: string | number) {
  return useQuery<Exhibition, Error>({
    queryKey: ["exhibition", id],   // cache แยกตาม id
    queryFn: () => fetchExhibitionById(id),
    enabled: !!id,                  // กัน query ตอน id ยังว่าง
  });
}
