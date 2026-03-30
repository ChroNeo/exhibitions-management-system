import liff from "@line/liff";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import liffClient from "../../api/liffClient";
import { LIFF_CONFIG as LIFF_IDS } from "../../config/liff";
import { isLiffMockEnabled } from "../../hooks/useLiff";
import { TicketContent } from "./TicketContent";

export default function TicketPage() {
  const [searchParams] = useSearchParams();
  const queryExhibitionId = searchParams.get("exhibitionId");
  const [exhibitionId, setExhibitionId] = useState<string | null>(null);
  const [fetchingExhibition, setFetchingExhibition] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // FS5: Use liffClient instead of raw axios + VITE_BASE
  useEffect(() => {
    async function fetchCurrentExhibition() {
      if (queryExhibitionId) {
        if (/^\d+$/.test(queryExhibitionId)) {
          setExhibitionId(queryExhibitionId);
          setErrorMessage(null);
        } else {
          setExhibitionId(null);
          setErrorMessage("Exhibition ID is invalid.");
        }
        setFetchingExhibition(false);
        return;
      }

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
          setErrorMessage(null);
        } else {
          setExhibitionId(null);
          setErrorMessage("No current exhibition available");
        }
      } catch {
        // Silently fail — no exhibition will be shown
      } finally {
        setFetchingExhibition(false);
      }
    }
    void fetchCurrentExhibition();
  }, [queryExhibitionId]);

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
          text: errorMessage ?? "No current exhibition available",
        });
      }
    }
  }, [errorMessage, exhibitionId, fetchingExhibition]);

  if (fetchingExhibition || !exhibitionId) {
    return null;
  }

  return <TicketContent exhibitionId={exhibitionId} />;
}
