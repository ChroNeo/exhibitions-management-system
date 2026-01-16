import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import CertificateLayoutEditor from "../../components/CertificateEditor/CertificateLayoutEditor";
import CertificatePreview from "../../components/CertificateEditor/CertificatePreview";
import { useExhibition, useAuthStatus } from "../../hooks";
import {
  useCertificateTemplate,
  useCreateCertificateTemplate,
  useUpdateCertificateTemplate,
  useDeleteCertificateTemplate,
} from "./hooks";
import NotFound from "../../components/NotFound";
import { toFileUrl } from "../../utils/url";
import { downloadCertificate } from "../../api/certificate";
import type { LayoutConfig } from "../../types/certificate";

import styles from "./CertificatePage.module.css";

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  participant_name: {
    x: 300,
    y: 500,
    font_size: 48,
    color: "#000000",
    align: "center",
  },
  exhibition_title: {
    x: 300,
    y: 200,
    font_size: 36,
    color: "#333333",
    align: "center",
  },
  date: {
    x: 300,
    y: 600,
    font_size: 24,
    color: "#666666",
    align: "center",
  },
  organizer_name: {
    x: 300,
    y: 700,
    font_size: 20,
    color: "#666666",
    align: "center",
  },
};

export default function CertificatePage() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const navigate = useNavigate();
  const hasAuthToken = useAuthStatus();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [testUserId, setTestUserId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch exhibition details
  const {
    data: exhibition,
    isLoading: isLoadingExhibition,
    isError: isExhibitionError,
  } = useExhibition(exhibitionId ?? "", { enabled: !!exhibitionId });

  // Fetch certificate template
  const {
    data: template,
    isLoading: isLoadingTemplate,
  } = useCertificateTemplate(exhibitionId ?? "", { enabled: !!exhibitionId });

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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Clear file selection
  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Upload/Create template
  const handleUpload = async () => {
    if (!exhibitionId || !selectedFile) return;

    try {
      await createTemplate({
        exhibitionId,
        payload: {
          file: selectedFile,
          layout_config: DEFAULT_LAYOUT_CONFIG,
        },
      });

      await Swal.fire({
        title: "อัปโหลดสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });

      handleClearFile();
    } catch (error) {
      console.error("Failed to upload certificate template", error);
      await Swal.fire({
        title: "อัปโหลดไม่สำเร็จ",
        text: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // Update template
  const handleUpdate = async () => {
    if (!exhibitionId || !selectedFile) return;

    try {
      await updateTemplate({
        exhibitionId,
        payload: {
          file: selectedFile,
        },
      });

      await Swal.fire({
        title: "อัปเดตสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });

      handleClearFile();
    } catch (error) {
      console.error("Failed to update certificate template", error);
      await Swal.fire({
        title: "อัปเดตไม่สำเร็จ",
        text: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // Save layout config
  const handleSaveLayout = async (newConfig: LayoutConfig) => {
    if (!exhibitionId) return;

    try {
      await updateTemplate({
        exhibitionId,
        payload: { layout_config: newConfig },
      });

      await Swal.fire({
        title: "บันทึก Layout สำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });

      setIsEditingLayout(false);
    } catch (error) {
      console.error("Failed to save layout config", error);
      await Swal.fire({
        title: "บันทึกไม่สำเร็จ",
        text: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
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
        // 3. แก้ข้อความเตือน
        title: "กรุณาระบุ User ID",
        icon: "warning",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // เรียก service ตัวใหม่ที่รับ userId
      const blob = await downloadCertificate(exhibitionId, testUserId);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // 4. *** สำคัญ *** เปลี่ยนนามสกุลเป็น .pdf
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

      <div className="container">
        <Panel title="จัดการ Certificate Template" onBack={handleBack}>
          {!isLoading && exhibition && (
            <div className={styles.content}>
              {/* Current Template */}
              {template && (
                <div className={styles.currentTemplate}>
                  <h4>Template ปัจจุบัน</h4>

                  {isEditingLayout ? (
                    <CertificateLayoutEditor
                      backgroundUrl={toFileUrl(template.background_url)}
                      layoutConfig={
                        template.layout_config ?? DEFAULT_LAYOUT_CONFIG
                      }
                      onSave={handleSaveLayout}
                      onCancel={() => setIsEditingLayout(false)}
                      isSaving={isUpdating}
                    />
                  ) : (
                    <>
                      <div className={styles.templatePreview}>
                        <CertificatePreview
                          backgroundUrl={toFileUrl(template.background_url)}
                          layoutConfig={template.layout_config}
                        />
                      </div>
                      <p className={styles.templateInfo}>
                        อัปเดตล่าสุด:{" "}
                        {template.updated_at
                          ? new Date(template.updated_at).toLocaleString(
                              "th-TH"
                            )
                          : "-"}
                      </p>

                      {hasAuthToken && (
                        <button
                          type="button"
                          onClick={() => setIsEditingLayout(true)}
                          className={styles.editLayoutButton}
                        >
                          แก้ไข Layout
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Upload Section */}
              {hasAuthToken && (
                <div className={styles.uploadSection}>
                  <h4>
                    {template ? "เปลี่ยนไฟล์พื้นหลัง" : "อัปโหลดไฟล์พื้นหลัง"}
                  </h4>

                  <div className={styles.fileInput}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      id="certificate-file"
                    />
                    <label
                      htmlFor="certificate-file"
                      className={styles.fileLabel}
                    >
                      {selectedFile
                        ? selectedFile.name
                        : "เลือกไฟล์ (รูปภาพ หรือ PDF)"}
                    </label>
                  </div>

                  {/* Preview */}
                  {previewUrl && (
                    <div className={styles.uploadPreview}>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className={styles.previewImage}
                      />
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className={styles.clearButton}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className={styles.actions}>
                    {selectedFile && !template && (
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isMutating}
                        className={styles.uploadButton}
                      >
                        {isCreating ? "กำลังอัปโหลด..." : "อัปโหลด"}
                      </button>
                    )}

                    {selectedFile && template && (
                      <button
                        type="button"
                        onClick={handleUpdate}
                        disabled={isMutating}
                        className={styles.updateButton}
                      >
                        {isUpdating ? "กำลังอัปเดต..." : "อัปเดต"}
                      </button>
                    )}

                    {template && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isMutating}
                        className={styles.deleteButton}
                      >
                        {isDeleting ? "กำลังลบ..." : "ลบ Template"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!hasAuthToken && (
                <p className={styles.authWarning}>
                  กรุณาเข้าสู่ระบบเพื่อจัดการ Certificate Template
                </p>
              )}

              {template && (
                <div className={styles.testDownloadSection}>
                  <h4>ทดสอบดาวน์โหลดใบประกาศนียบัตร</h4>
                  <div className={styles.testDownloadForm}>
                    <input
                      type="text"
                      // 2. แก้ Placeholder เป็น User ID
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
