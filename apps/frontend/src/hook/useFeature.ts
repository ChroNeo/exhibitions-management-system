import { useQuery } from "@tanstack/react-query";
import { fetchFeature } from "../api/feature";

export function useFeature() {
  return useQuery({
    queryKey: ["feature"],
    queryFn: fetchFeature,
  });
}
