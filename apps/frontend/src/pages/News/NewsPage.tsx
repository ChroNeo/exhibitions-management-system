import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import { toFileUrl } from "../../utils/url";
import styles from "./NewsPage.module.css";
import { useCreateNews, useDeleteNews, useNewsList } from "./hooks/useNews";

export default function NewsPage() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const navigate = useNavigate();
  const exId = Number(exhibitionId);
  const { data: newsList = [] } = useNewsList(exId);
  const createNewsMutation = useCreateNews(exId);
  const deleteNewsMutation = useDeleteNews(exId);

  // State สำหรับฟอร์มปัจจุบัน
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    image: File | null;
    imagePreview: string | null;
  }>({
    title: "",
    description: "",
    image: null,
    imagePreview: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // จัดการการเปลี่ยนข้อมูลใน Input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // จัดการการอัปโหลดรูปภาพ
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: imageUrl,
      }));
    }
  };

  // ล้างรูปภาพที่เลือก
  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // บันทึกข่าวสาร
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.imagePreview) return;

    createNewsMutation.mutate(
      {
        exhibition_id: exId,
        topic: formData.title,
        description: formData.description || null,
        is_active: 1,
        file: formData.image ?? undefined,
      },
      {
        onSuccess: () => {
          setFormData({
            title: "",
            description: "",
            image: null,
            imagePreview: null,
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      },
    );
  };

  // ลบข่าวสาร
  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบข่าวนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      confirmButtonColor: "#ef4444",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteNewsMutation.mutateAsync(id);
      await Swal.fire({
        title: "ลบข่าวสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } catch {
      await Swal.fire({
        title: "ลบไม่สำเร็จ กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <HeaderBar />
      <main className={styles.main}>
        <div className={styles.backRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(`/exhibitions/${exhibitionId}`)}
          >
            <ArrowLeft size={20} />
            กลับ
          </button>
          <h1 className={styles.pageTitle}>ข่าวสารและประกาศ</h1>
        </div>
        <div className={styles.grid}>
          {/* ส่วนฟอร์มสร้างข่าว (Left Column) */}
          <div>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formHeaderTitle}>
                  <Plus className={styles.iconSm} /> สร้างข่าวสารใหม่
                </h2>
              </div>

              <form onSubmit={handleSubmit} className={styles.formBody}>
                {/* Image Upload Area */}
                <div className={styles.uploadGroup}>
                  <label className={styles.label}>
                    รูปภาพประกอบ <span className={styles.required}>*</span>
                  </label>

                  {!formData.imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.dropzone}
                    >
                      <div className={styles.dropzoneInner}>
                        <div className={styles.dropzoneIconWrap}>
                          <ImageIcon className={styles.dropzoneIcon} />
                        </div>
                        <p className={styles.dropzoneText}>
                          คลิกเพื่ออัปโหลดรูปภาพ
                        </p>
                        <p className={styles.dropzoneHint}>
                          PNG, JPG (แนะนำขนาด 1200x630)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.previewWrap}>
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className={styles.previewImg}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className={styles.previewRemoveBtn}
                      >
                        <X className={styles.iconXs} />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className={styles.hiddenInput}
                  />
                </div>

                {/* Input Fields */}
                <div className={styles.fields}>
                  <div>
                    <label htmlFor="title" className={styles.labelSmall}>
                      หัวข้อข่าว <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="เช่น โปรโมชั่นบัตรเข้างาน..."
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className={styles.labelSmall}>
                      รายละเอียดสั้นๆ (Optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="ใส่รายละเอียดเล็กน้อย เพราะเนื้อหาหลักอยู่ในรูปภาพ..."
                      className={styles.textarea}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!formData.title || !formData.imagePreview}
                  className={styles.submitBtn}
                >
                  <Send className={styles.iconXs} /> โพสต์ข่าวสาร
                </button>
              </form>
            </div>
          </div>

          {/* ส่วนแสดงผล (Right Column - Feed) */}
          <div className={styles.feedColumn}>
            <div className={styles.feedHeader}>
              <h2 className={styles.feedTitle}>
                ข่าวสารทั้งหมด ({newsList.length})
              </h2>
              <div className={styles.feedBadge}>มุมมองมือถือ</div>
            </div>

            <div className={styles.feedList}>
              {newsList.length === 0 ? (
                <div className={styles.emptyState}>
                  <Camera className={styles.emptyIcon} />
                  <p className={styles.emptyText}>
                    ยังไม่มีข่าวสาร กดสร้างข่าวใหม่ได้เลย
                  </p>
                </div>
              ) : (
                newsList.map((news) => (
                  <div key={news.announcement_id} className={styles.newsCard}>
                    {/* ส่วนรูปภาพ - เน้นใหญ่ตามโจทย์ */}
                    <div className={styles.newsImageWrap}>
                      <img
                        src={toFileUrl(news.image_url)}
                        alt={news.topic}
                        className={styles.newsImage}
                      />
                      <div className={styles.newsDeleteWrap}>
                        <button
                          onClick={() => handleDelete(news.announcement_id)}
                          className={styles.newsDeleteBtn}
                          title="ลบข่าว"
                        >
                          <Trash2 className={styles.iconXs} />
                        </button>
                      </div>
                    </div>

                    {/* ส่วนเนื้อหา */}
                    <div className={styles.newsContent}>
                      <div className={styles.newsMeta}>
                        <span className={styles.newsTag}>News Update</span>
                        <span className={styles.newsDate}>
                          {news.created_at}
                        </span>
                      </div>
                      <h3 className={styles.newsTitle}>{news.topic}</h3>
                      {news.description && (
                        <p className={styles.newsDesc}>{news.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
