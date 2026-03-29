import liff from "@line/liff";
import { useCallback, useEffect, useState } from "react";
import {
  downloadCertificate,
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

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent);
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

  const handleDownload = useCallback(async () => {
    if (!exhibitionId || !userId) return;

    setState({ status: "downloading" });
    const isLineClient = liff.isInClient();
    const isAndroid = isAndroidDevice();

    try {
      if (isLineClient && isAndroid) {
        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error("Failed to get LIFF ID token");
        }

        const externalUrl = getCertificateDownloadUrl(exhibitionId, userId, {
          liffIdToken: idToken,
        });

        liff.openWindow({
          url: externalUrl,
          external: true,
        });

        setState({ status: "download_complete" });
        setTimeout(() => {
          if (previewData) {
            setState({ status: "success", data: previewData });
          }
        }, 2000);
        return;
      }

      const blob = await downloadCertificate(exhibitionId, userId);
      const fileUrl = URL.createObjectURL(blob);

      if (isLineClient && typeof navigator.share === "function") {
        const file = new File([blob], `certificate_${userId}.pdf`, {
          type: "application/pdf",
        });
        if (
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            title: "Certificate",
            text: "ดาวน์โหลดใบประกาศนียบัตร",
            files: [file],
          });
        } else {
          // Fallback if share with files is unsupported
          window.location.href = fileUrl;
        }
      } else if (isLineClient) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.target = "_self";
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `certificate_${userId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // Keep blob URL alive for a while to ensure viewer can load on mobile.
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);

      setState({ status: "download_complete" });
      setTimeout(() => {
        if (previewData) {
          setState({ status: "success", data: previewData });
        }
      }, 2000);
    } catch (error) {
      // User canceled share dialog should not be treated as hard error.
      if (error instanceof DOMException && error.name === "AbortError") {
        if (previewData) {
          setState({ status: "success", data: previewData });
        }
        return;
      }
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "ดาวน์โหลดใบประกาศนียบัตรไม่สำเร็จ",
      });
    }
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
