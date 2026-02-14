import { useQuery } from "@tanstack/react-query";
import {
  getNewsByExhibitionId,
  getNewsLists,
} from "../../../api/newsApi";

export function useAllNews(exhibitionId?: number) {
  return useQuery({
    queryKey: exhibitionId ? ["news", exhibitionId] : ["news", "all"],
    queryFn: () =>
      exhibitionId ? getNewsByExhibitionId(exhibitionId) : getNewsLists(),
  });
}
