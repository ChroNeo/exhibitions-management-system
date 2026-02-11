import {
  Camera,
  Image as ImageIcon,
  Layout,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import styles from "./NewsPage.module.css";

export default function NewsPage() {
  // State สำหรับเก็บรายการข่าวทั้งหมด
  const [newsList, setNewsList] = useState([
    {
      id: 1,
      title: "เตรียมพบกับโซนใหม่: Future Art",
      description: "เปิดประสบการณ์ศิลปะดิจิทัลเต็มรูปแบบ เจอกันที่ Hall 2",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80",
      date: new Date().toLocaleDateString("th-TH"),
    },
  ]);

  // State สำหรับฟอร์มปัจจุบัน
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    imagePreview: null,
  });

  const fileInputRef = useRef(null);

  // จัดการการเปลี่ยนข้อมูลใน Input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // จัดการการอัปโหลดรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.imagePreview) return;

    const newNews = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      image: formData.imagePreview,
      date: new Date().toLocaleDateString("th-TH"),
    };

    setNewsList([newNews, ...newsList]);

    // Reset Form
    setFormData({
      title: "",
      description: "",
      image: null,
      imagePreview: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ลบข่าวสาร
  const handleDelete = (id) => {
    setNewsList(newsList.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.navRow}>
            <div className={styles.navBrand}>
              <Layout className={styles.navIcon} />
              <h1 className={styles.navTitle}>Exhibition News Admin</h1>
            </div>
            <div className={styles.navSubtitle}>สำหรับผู้จัดนิทรรศการ</div>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
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
                      onClick={() => fileInputRef.current.click()}
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
                      rows="3"
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
                  <div key={news.id} className={styles.newsCard}>
                    {/* ส่วนรูปภาพ - เน้นใหญ่ตามโจทย์ */}
                    <div className={styles.newsImageWrap}>
                      <img
                        src={news.image}
                        alt={news.title}
                        className={styles.newsImage}
                      />
                      <div className={styles.newsDeleteWrap}>
                        <button
                          onClick={() => handleDelete(news.id)}
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
                        <span className={styles.newsDate}>{news.date}</span>
                      </div>
                      <h3 className={styles.newsTitle}>{news.title}</h3>
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
