import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import liffClient from "../../../api/liffClient";
import {
  getNewsByExhibitionId,
  getNewsByExhibitionIdLiff,
  getNewsLists,
} from "../../../api/newsApi";
import { useLiff } from "../../../hooks";
import type { NewsLists } from "../../../types/news";
import type { UnitApi } from "../../../types/units";

export interface NewsPageData {
  news: NewsLists[];
  upcomingUnits: UnitApi[];
}

export function useAllNews(exhibitionId?: number) {
  return useQuery({
    queryKey: exhibitionId ? ["news", exhibitionId] : ["news", "all"],
    queryFn: () =>
      exhibitionId ? getNewsByExhibitionId(exhibitionId) : getNewsLists(),
  });
}

export function useAllNewsLiff() {
  // FS5: Use liffClient instead of raw axios + VITE_BASE
  const fetchData = useCallback(async (): Promise<NewsPageData> => {
    const res = await liffClient.get<{ current_exhibition_id: number | null }>(
      "/ticket/current-exhibition",
    );

    const exhibitionId = res.data.current_exhibition_id;
    if (!exhibitionId) {
      throw new Error("ไม่พบงานนิทรรศการปัจจุบัน");
    }

    const [news, upcomingRes] = await Promise.all([
      getNewsByExhibitionIdLiff(exhibitionId),
      liffClient.get<UnitApi[]>(`/exhibitions/${exhibitionId}/units/upcoming`),
    ]);

    return { news, upcomingUnits: upcomingRes.data ?? [] };
  }, []);

  return useLiff({
    liffApp: "NEWS",
    fetchData,
  });
}
