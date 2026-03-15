import liff from "@line/liff";
import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { LIFF_CONFIG as LIFF_IDS } from "../../config/liff";
import { ExhibitionSurveyContent } from "./components/ExhibitionSurveyContent";
const API_BASE = import.meta.env.VITE_BASE;

export default function ExhibitionSurveyPage() {
  const [exhibitionId, setExhibitionId] = useState<string | null>(null);
  const [fetchingExhibition, setFetchingExhibition] = useState(true);

  // Fetch current exhibition ID from API
  useEffect(() => {
    async function fetchCurrentExhibition() {
      try {
        if (!liff.id) {
          await liff.init({ liffId: LIFF_IDS.SURVEY });
        }
        if (!liff.isLoggedIn()) return;
        const idToken = liff.getIDToken();
        if (!idToken) return;
        const res = await axios.get<{ current_exhibition_id: number | null }>(
          `${API_BASE}/api/v1/ticket/current-exhibition`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          },
        );
        if (res.data.current_exhibition_id) {
          setExhibitionId(String(res.data.current_exhibition_id));
        }
      } catch (err) {
        console.error("Failed to fetch current exhibition:", err);
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
          text: "No current exhibition found",
        });
      }
    }
  }, [fetchingExhibition, exhibitionId]);

  if (fetchingExhibition || !exhibitionId) {
    return null;
  }

  return <ExhibitionSurveyContent exhibitionId={exhibitionId} />;
}
