import liff from "@line/liff";
import { useCallback, useEffect, useState } from "react";
import {
  fetchCertificatePreview,
  getCertificateDownloadUrl,
  type CertificatePreviewData,
} from "../../../api/certificate";
import { LIFF_CONFIG } from "../../../config/liff";

export type CertificateDownloadState =
  | { status: "initializing" }
  | { status: "not_logged_in" }
  | { status: "loading" }
  | { status: "success"; data: CertificatePreviewData }
  | { status: "error"; message: string }
  | { status: "downloading" }
  | { status: "download_complete" };

interface UseCertificateDownloadOptions {
  exhibitionId: string | null;
  userId: string | null;
}

export function useCertificateDownload({
  exhibitionId,
  userId,
}: UseCertificateDownloadOptions) {
  const [state, setState] = useState<CertificateDownloadState>({
    status: "initializing",
  });
  const [previewData, setPreviewData] = useState<CertificatePreviewData | null>(
    null,
  );

  const fetchPreview = useCallback(async () => {
    if (!exhibitionId || !userId) {
      setState({
        status: "error",
        message: "ไม่พบข้อมูล Exhibition หรือ User",
      });
      return;
    }

    setState({ status: "loading" });

    try {
      const data = await fetchCertificatePreview(exhibitionId, userId);
      setPreviewData(data);
      setState({ status: "success", data });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }
  }, [exhibitionId, userId]);

  const initializeLiff = useCallback(async () => {
    try {
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG.CERTIFICATE });
      }

      if (!liff.isLoggedIn()) {
        setState({ status: "not_logged_in" });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      await fetchPreview();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "LIFF Init Failed",
      });
    }
  }, [fetchPreview]);

  const handleDownload = useCallback(() => {
    if (!exhibitionId || !userId) return;

    // Get the direct download URL
    const downloadUrl = getCertificateDownloadUrl(exhibitionId, userId);

    // Use liff.openWindow to open in external browser for download
    // This works better in LINE's in-app browser
    if (liff.isInClient()) {
      liff.openWindow({
        url: downloadUrl,
        external: true,
      });
    } else {
      // For regular browser, just open the URL
      window.open(downloadUrl, "_blank");
    }

    setState({ status: "download_complete" });

    // Reset to success state after a moment
    setTimeout(() => {
      if (previewData) {
        setState({ status: "success", data: previewData });
      }
    }, 2000);
  }, [exhibitionId, userId, previewData]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  return {
    state,
    previewData,
    handleDownload,
    refetch: fetchPreview,
  };
}
