import liff from "@line/liff";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import liffClient from "../../api/liffClient";
import { LIFF_CONFIG as LIFF_IDS } from "../../config/liff";
import { isLiffMockEnabled } from "../../hooks/useLiff";
import { TicketContent } from "./TicketContent";

export default function TicketPage() {
  const [exhibitionId, setExhibitionId] = useState<string | null>(null);
  const [fetchingExhibition, setFetchingExhibition] = useState(true);

  // FS5: Use liffClient instead of raw axios + VITE_BASE
  useEffect(() => {
    async function fetchCurrentExhibition() {
      try {
        if (!isLiffMockEnabled()) {
          if (!liff.id) {
            await liff.init({ liffId: LIFF_IDS.TICKET });
          }
          if (!liff.isLoggedIn()) return;
        }
        const res = await liffClient.get<{
          current_exhibition_id: number | null;
        }>("/ticket/current-exhibition");
        if (res.data.current_exhibition_id) {
          setExhibitionId(String(res.data.current_exhibition_id));
        }
      } catch {
        // Silently fail — no exhibition will be shown
      } finally {
        setFetchingExhibition(false);
      }
    }
    fetchCurrentExhibition();
  }, []);

  useEffect(() => {
    if (fetchingExhibition) {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
    } else {
      Swal.close();
      if (!exhibitionId) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No current exhibition available",
        });
      }
    }
  }, [fetchingExhibition, exhibitionId]);

  if (fetchingExhibition || !exhibitionId) {
    return null;
  }

  return <TicketContent exhibitionId={exhibitionId} />;
}
