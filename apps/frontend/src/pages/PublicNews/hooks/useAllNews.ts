import liff from "@line/liff";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback } from "react";
import {
  getNewsByExhibitionId,
  getNewsByExhibitionIdLiff,
  getNewsLists,
} from "../../../api/newsApi";
import { LIFF_CONFIG } from "../../../config/liff";
import { useLiff } from "../../../hooks";
import type { NewsLists } from "../../../types/news";

const API_BASE = import.meta.env.VITE_BASE;

export function useAllNews(exhibitionId?: number) {
  return useQuery({
    queryKey: exhibitionId ? ["news", exhibitionId] : ["news", "all"],
    queryFn: () =>
      exhibitionId ? getNewsByExhibitionId(exhibitionId) : getNewsLists(),
  });
}

export function useAllNewsLiff() {
  const fetchData = useCallback(async (): Promise<NewsLists[]> => {
    // Init LIFF if needed
    if (!liff.id) {
      await liff.init({ liffId: LIFF_CONFIG.NEWS });
    }
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error("Failed to get LIFF ID token");
    }

    // Fetch current exhibition ID from backend
    const res = await axios.get<{ current_exhibition_id: number | null }>(
      `${API_BASE}/api/v1/ticket/current-exhibition`,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      },
    );

    const exhibitionId = res.data.current_exhibition_id;
    if (!exhibitionId) {
      throw new Error("ไม่พบงานนิทรรศการปัจจุบัน");
    }

    return await getNewsByExhibitionIdLiff(exhibitionId);
  }, []);

  return useLiff({
    liffApp: "NEWS",
    fetchData,
  });
}
