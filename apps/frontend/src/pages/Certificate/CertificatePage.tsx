import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { downloadCertificate } from "../../api/certificate";
import CertificatePreview from "../../components/CertificateEditor/CertificatePreview";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import NotFound from "../../components/NotFound";
import Panel from "../../components/Panel/Panel";
import { useAuthStatus, useExhibition } from "../../hooks";
import type { LayoutConfig } from "../../types/certificate";
import { toFileUrl } from "../../utils/url";
import {
  useCertificateTemplate,
  useCreateCertificateTemplate,
  useDeleteCertificateTemplate,
  useUpdateCertificateTemplate,
} from "./hooks";

import styles from "./CertificatePage.module.css";

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function buildCenteredLayoutConfig(
  width: number,
  height: number,
): LayoutConfig {
  const centerX = Math.round(width / 2);
  return {
    participant_name: {
      x: centerX,
      y: Math.round(height * 0.5),
      font_size: 48,
      color: "#000000",
      align: "center",
    },
    exhibition_title: {
      x: centerX,
      y: Math.round(height * 0.25),
      font_size: 36,
      color: "#333333",
      align: "center",
    },
    date: {
      x: centerX,
      y: Math.round(height * 0.65),
      font_size: 24,
      color: "#666666",
      align: "center",
    },
    organizer_name: {
      x: centerX,
      y: Math.round(height * 0.75),
      font_size: 20,
      color: "#666666",
      align: "center",
    },
  };
}

export default function CertificatePage() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const navigate = useNavigate();
  const hasAuthToken = useAuthStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [testUserId, setTestUserId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch exhibition details
  const {
    data: exhibition,
    isLoading: isLoadingExhibition,
    isError: isExhibitionError,
  } = useExhibition(exhibitionId ?? "", { enabled: !!exhibitionId });

  // Fetch certificate template
  const { data: template, isLoading: isLoadingTemplate } =
    useCertificateTemplate(exhibitionId ?? "", { enabled: !!exhibitionId });

  // Mutations
  const { mutateAsync: createTemplate, isPending: isCreating } =
    useCreateCertificateTemplate();
  const { mutateAsync: updateTemplate, isPending: isUpdating } =
    useUpdateCertificateTemplate();
  const { mutateAsync: deleteTemplate, isPending: isDeleting } =
    useDeleteCertificateTemplate();

  const isLoading = isLoadingExhibition || isLoadingTemplate;
  const isMutating = isCreating || isUpdating || isDeleting;

  useEffect(() => {
    if (isLoading) {
      Swal.fire({
        title: "กำลังโหลด",
        didOpen: () => {
          Swal.showLoading();
        },
      });
    } else {
      Swal.close();
    }
  }, [isLoading]);

  // Handle file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !exhibitionId) return;

    try {
      const { width, height } = await getImageDimensions(file);
      const layoutConfig = buildCenteredLayoutConfig(width, height);

      if (template) {
        // Update existing template
        await updateTemplate({
          exhibitionId,
          payload: { file, layout_config: layoutConfig },
        });
        await Swal.fire({
          title: "อัปเดตสำเร็จ",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
      } else {
        // Create new template
        await createTemplate({
          exhibitionId,
          payload: {
            file,
            layout_config: layoutConfig,
          },
        });
        await Swal.fire({
          title: "อัปโหลดสำเร็จ",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      console.error("Failed to upload certificate template", error);
      await Swal.fire({
        title: template ? "อัปเดตไม่สำเร็จ" : "อัปโหลดไม่สำเร็จ",
        text: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Delete template
  const handleDelete = async () => {
    if (!exhibitionId) return;

    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบ Certificate Template?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      confirmButtonColor: "#ef4444",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await deleteTemplate(exhibitionId);
      await Swal.fire({
        title: "ลบสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      console.error("Failed to delete certificate template", error);
      await Swal.fire({
        title: "ลบไม่สำเร็จ",
        text: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  const handleBack = () => {
    if (exhibitionId) {
      navigate(`/exhibitions/${exhibitionId}`);
    } else {
      navigate("/exhibitions");
    }
  };

  const handleTestDownload = async () => {
    if (!exhibitionId || !testUserId) {
      await Swal.fire({
        title: "กรุณาระบุ User ID",
        icon: "warning",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Admin test download - skip check-in validation
      const blob = await downloadCertificate(exhibitionId, testUserId, {
        skipValidation: true,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate_${testUserId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await Swal.fire({
        title: "ดาวน์โหลดสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      console.error("Failed to download certificate", error);
      await Swal.fire({
        title: "ดาวน์โหลดไม่สำเร็จ",
        text: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isExhibitionError) {
    return <NotFound />;
  }

  return (
    <div>
      <HeaderBar
        active="exhibition_unit"
        onLoginClick={() => navigate("/login")}
      />

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className="container">
        <Panel title="จัดการ Certificate Template" onBack={handleBack}>
          {!isLoading && exhibition && (
            <div className={styles.content}>
              {/* Template exists - show preview or editor */}
              {template && (
                <div className={styles.currentTemplate}>
                  <div className={styles.templatePreview}>
                    <CertificatePreview
                      backgroundUrl={toFileUrl(template.background_url)}
                      layoutConfig={template.layout_config}
                    />
                  </div>
                  <p className={styles.templateInfo}>
                    อัปเดตล่าสุด:{" "}
                    {template.updated_at
                      ? new Date(template.updated_at).toLocaleString("th-TH")
                      : "-"}
                  </p>

                  {hasAuthToken && (
                    <div className={styles.actionButtons}>
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        className={styles.uploadButton}
                        disabled={isMutating}
                      >
                        {isCreating || isUpdating
                          ? "กำลังอัปโหลด..."
                          : "อัปโหลด"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isMutating}
                        className={styles.deleteButton}
                      >
                        {isDeleting ? "กำลังลบ..." : "ลบ Template"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No template - show upload prompt */}
              {!template && hasAuthToken && (
                <div className={styles.noTemplate}>
                  <p>ยังไม่มี Certificate Template</p>
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className={styles.uploadButton}
                    disabled={isMutating}
                  >
                    {isCreating ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์พื้นหลัง"}
                  </button>
                </div>
              )}

              {!hasAuthToken && (
                <p className={styles.authWarning}>
                  กรุณาเข้าสู่ระบบเพื่อจัดการ Certificate Template
                </p>
              )}

              {/* Test download section */}
              {template && (
                <div className={styles.testDownloadSection}>
                  <h4>ทดสอบดาวน์โหลดใบประกาศนียบัตร</h4>
                  <div className={styles.testDownloadForm}>
                    <input
                      type="text"
                      placeholder="UserId"
                      value={testUserId}
                      onChange={(e) => setTestUserId(e.target.value)}
                      className={styles.testInput}
                    />
                    <button
                      type="button"
                      onClick={handleTestDownload}
                      disabled={isDownloading || !testUserId}
                      className={styles.testDownloadButton}
                    >
                      {isDownloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลด"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
