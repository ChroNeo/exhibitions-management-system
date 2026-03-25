import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { TextChangeHandler } from "quill";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import type { NewsLists } from "../../types/news";
import { optimizeImage } from "../../utils/imageOptimize";
import type { Quill as QuillType } from "../../utils/quill";
import { initializeRichTextEditor } from "../../utils/quill";
import { toDeltaObject, toDeltaString } from "../../utils/quillDelta";
import { toFileUrl } from "../../utils/url";
import styles from "./NewsPage.module.css";
import {
  useCreateNews,
  useDeleteNews,
  useNewsList,
  useUpdateNews,
} from "./hooks/useNews";

type FormData = {
  title: string;
  description: string;
  description_delta: string;
  image: File | null;
  imagePreview: string | null;
};

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  description_delta: "",
  image: null,
  imagePreview: null,
};

export default function NewsPage() {
  const { exhibitionId } = useParams<{ exhibitionId: string }>();
  const navigate = useNavigate();
  const exId = Number(exhibitionId);
  const { data: newsList = [] } = useNewsList(exId);
  const createNewsMutation = useCreateNews(exId);
  const updateNewsMutation = useUpdateNews(exId);
  const deleteNewsMutation = useDeleteNews(exId);

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillElRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillType | null>(null);

  // Init Quill editor
  useEffect(() => {
    if (!quillElRef.current || quillRef.current) return;

    const { quill, cleanup } = initializeRichTextEditor({
      container: quillElRef.current,
      placeholder: "รายละเอียดข่าวสาร (Optional)...",
    });

    const handleTextChange: TextChangeHandler = (_d, _o, source) => {
      if (source !== "user") return;
      const deltaString = JSON.stringify(quill.getContents());
      const plainText = quill.getText().trim();
      setFormData((prev) =>
        prev.description_delta === deltaString
          ? prev
          : { ...prev, description_delta: deltaString, description: plainText },
      );
    };

    quill.on("text-change", handleTextChange);
    quillRef.current = quill;

    return () => {
      quill.off("text-change", handleTextChange);
      quillRef.current = null;
      cleanup();
    };
  }, []);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quillRef.current?.setContents([] as any, "silent");
  };

  const handleEdit = (news: NewsLists) => {
    setEditingId(news.announcement_id);
    setFormData({
      title: news.topic,
      description: news.description ?? "",
      description_delta: news.description_delta ?? "",
      image: null,
      imagePreview: news.image_url ? toFileUrl(news.image_url) : null,
    });
    // Hydrate Quill with existing delta
    if (quillRef.current) {
      const deltaObj = toDeltaObject(news.description_delta);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quillRef.current.setContents(deltaObj as any, "silent");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const optimized = await optimizeImage(file);
      setFormData((prev) => ({
        ...prev,
        image: optimized,
        imagePreview: URL.createObjectURL(optimized),
      }));
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null, imagePreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingId !== null) {
      // Edit mode — image is optional (keep existing if not changed)
      updateNewsMutation.mutate(
        {
          id: editingId,
          data: {
            topic: formData.title,
            description: formData.description || null,
            description_delta:
              toDeltaString(formData.description_delta) || null,
            file: formData.image ?? undefined,
          },
        },
        {
          onSuccess: async () => {
            resetForm();
            await Swal.fire({
              title: "แก้ไขข่าวสำเร็จ",
              icon: "success",
              confirmButtonText: "ตกลง",
              timer: 1500,
              showConfirmButton: false,
            });
          },
        },
      );
    } else {
      // Create mode — image required
      if (!formData.imagePreview) return;
      createNewsMutation.mutate(
        {
          exhibition_id: exId,
          topic: formData.title,
          description: formData.description || null,
          description_delta: toDeltaString(formData.description_delta) || null,
          is_active: 1,
          file: formData.image ?? undefined,
        },
        { onSuccess: () => resetForm() },
      );
    }
  };

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
      if (editingId === id) resetForm();
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

  const isEditing = editingId !== null;
  const isSubmitDisabled = isEditing
    ? !formData.title
    : !formData.title || !formData.imagePreview;

  return (
    <div className={styles.page}>
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
          {/* Left Column — Form */}
          <div>
            <div
              className={`${styles.formCard} ${isEditing ? styles.formCardEditing : ""}`}
            >
              <div className={styles.formHeader}>
                <h2 className={styles.formHeaderTitle}>
                  {isEditing ? (
                    <>
                      <Pencil className={styles.iconSm} /> แก้ไขข่าวสาร
                    </>
                  ) : (
                    <>
                      <Plus className={styles.iconSm} /> สร้างข่าวสารใหม่
                    </>
                  )}
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.cancelEditBtn}
                    title="ยกเลิกการแก้ไข"
                  >
                    <X className={styles.iconXs} /> ยกเลิก
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className={styles.formBody}>
                {/* Image Upload */}
                <div className={styles.uploadGroup}>
                  <label className={styles.label}>
                    รูปภาพประกอบ{" "}
                    {!isEditing && <span className={styles.required}>*</span>}
                    {isEditing && (
                      <span className={styles.labelHint}>
                        {" "}
                        (เว้นว่างเพื่อคงรูปเดิม)
                      </span>
                    )}
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
                    <label className={styles.labelSmall}>
                      รายละเอียด (Optional)
                    </label>
                    <div className={styles.editorWrap}>
                      <div ref={quillElRef} />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={`${styles.submitBtn} ${isEditing ? styles.submitBtnEdit : ""}`}
                >
                  <Send className={styles.iconXs} />
                  {isEditing ? "บันทึกการแก้ไข" : "โพสต์ข่าวสาร"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column — Feed */}
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
                  <div
                    key={news.announcement_id}
                    className={`${styles.newsCard} ${editingId === news.announcement_id ? styles.newsCardActive : ""}`}
                  >
                    <div className={styles.newsImageWrap}>
                      <img
                        src={toFileUrl(news.image_url)}
                        alt={news.topic}
                        className={styles.newsImage}
                      />
                      <div className={styles.newsActionsWrap}>
                        <button
                          onClick={() => handleEdit(news)}
                          className={styles.newsEditBtn}
                          title="แก้ไขข่าว"
                        >
                          <Pencil className={styles.iconXs} />
                        </button>
                        <button
                          onClick={() => handleDelete(news.announcement_id)}
                          className={styles.newsDeleteBtn}
                          title="ลบข่าว"
                        >
                          <Trash2 className={styles.iconXs} />
                        </button>
                      </div>
                    </div>

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
