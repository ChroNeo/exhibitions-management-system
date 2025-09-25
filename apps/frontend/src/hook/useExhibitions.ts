import { useQuery } from "@tanstack/react-query";
import { fetchExhibitions } from "../api/exhibitions";

export function useExhibitions() {
      return useQuery({
            queryKey: ["exhibitions"],
            queryFn: fetchExhibitions,
      });
}
