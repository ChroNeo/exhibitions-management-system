import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

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

const EXAMPLE_CERTIFICATE_IMAGE_URL = "/images/certificate-example.png";

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
      y: Math.round(height * 0.43),
      font_size: 100,
      color: "#000000",
      align: "center",
    },
  };
}

export default function CertificatePage() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const navigate = useNavigate();
  const hasAuthToken = useAuthStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExampleImageAvailable, setIsExampleImageAvailable] = useState(true);

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
      title: "ยืนยันการลบเทมเพลตใบประกาศนียบัตร?",
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
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className="container">
        <Panel title="จัดการใบประกาศนียบัตร" onBack={handleBack}>
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
                        {isDeleting ? "กำลังลบ..." : "ลบเทมเพลต"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No template - show upload prompt */}
              {!template && hasAuthToken && (
                <div className={styles.noTemplate}>
                  <div className={styles.exampleCertificateSection}>
                    <h4 className={styles.exampleTitle}>
                      ตัวอย่างใบประกาศนียบัตร
                    </h4>
                    <p className={styles.exampleHint}>
                      ขนาดแนะนำ 3300 x 2550 px | aspect ratio 11 x 8.5
                    </p>
                    {isExampleImageAvailable ? (
                      <img
                        src={EXAMPLE_CERTIFICATE_IMAGE_URL}
                        alt="ตัวอย่างเทมเพลตใบประกาศนียบัตร"
                        className={styles.exampleImage}
                        onError={() => setIsExampleImageAvailable(false)}
                      />
                    ) : (
                      <p className={styles.exampleMissing}>
                        ไม่พบรูปตัวอย่าง กรุณานำไฟล์มาวางตามพาธด้านบน
                      </p>
                    )}
                  </div>

                  <p>ยังไม่มีเทมเพลตใบประกาศนียบัตร</p>
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
                  กรุณาเข้าสู่ระบบเพื่อจัดการเทมเพลตใบประกาศนียบัตร
                </p>
              )}

            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
