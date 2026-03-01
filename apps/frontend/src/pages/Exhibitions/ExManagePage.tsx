import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import ExhibitionList from "../../components/exhibition/ExhibitionList";
import FloatingButton from "../../components/FloatingButton/FloatingButton";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import {
  useAuthStatus,
  useAuthUser,
  useDeleteExhibition,
  useExhibitions,
} from "../../hooks";
import type { Exhibition } from "../../types/exhibition";
import { toApiDateTime } from "../../utils/date";
import styles from "./ExManagePage.module.css";
import { useCreateExhibition } from "./hooks";

const STATUS_OPTIONS = [
  { value: "", label: "ทั้งหมด" },
  { value: "draft", label: "ร่าง" },
  { value: "published", label: "เผยแพร่" },
  { value: "ongoing", label: "กำลังจัด" },
  { value: "ended", label: "จบงาน" },
  { value: "archived", label: "เก็บ" },
];

type ModalStatus = "active" | "upcoming" | "ended";

const EMPTY_FORM = {
  title: "",
  startDate: "",
  endDate: "",
  location: "",
  organizer: "",
  description: "",
  status: null as ModalStatus | null,
  imagePreview: "",
  imageFile: null as File | null,
};

export default function ExhibitionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ ...EMPTY_FORM });
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const authUser = useAuthUser();
  const { mutateAsync: createExh, isPending: isCreating } =
    useCreateExhibition();

  // Handle LIFF redirect with exhibitionId query parameter
  useEffect(() => {
    let exhibitionId = searchParams.get("exhibitionId");

    if (!exhibitionId) {
      const liffState = searchParams.get("liff.state");
      if (liffState) {
        const stateParams = new URLSearchParams(
          liffState.replace(/^\/?\??/, ""),
        );
        exhibitionId = stateParams.get("exhibitionId");

        if (!exhibitionId && liffState.startsWith("/")) {
          exhibitionId = liffState.slice(1);
        }
      }
    }

    if (exhibitionId) {
      navigate(`/exhibitions/${exhibitionId}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const isAuthenticated = useAuthStatus();
  const { data, isLoading, isError } = useExhibitions();
  const items: Exhibition[] = useMemo(() => data ?? [], [data]);
  const { mutateAsync: deleteExhibitionAsync, isPending: isDeleting } =
    useDeleteExhibition();

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const ongoing = items.filter((e) => e.status === "ongoing").length;
    const published = items.filter((e) => e.status === "published").length;
    const ended = items.filter((e) => e.status === "ended").length;
    return { total, ongoing, published, ended };
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((ex) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        (ex.location ?? "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || ex.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  // ── Old navigation-based add (commented out) ──
  // const handleAdd = () => {
  //   navigate("/exhibitions/new");
  // };

  // ── New modal-based add ──
  const openAddModal = useCallback(() => {
    setModalForm({ ...EMPTY_FORM });
    setTitleError(false);
    setModalOpen(true);
    document.body.style.overflow = "hidden";
    setTimeout(() => titleRef.current?.focus(), 400);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    document.body.style.overflow = "";
  }, []);

  const updateForm = useCallback(
    <K extends keyof typeof EMPTY_FORM>(
      key: K,
      value: (typeof EMPTY_FORM)[K],
    ) => {
      setModalForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const selectStatus = useCallback((s: ModalStatus) => {
    setModalForm((prev) => ({ ...prev, status: s }));
  }, []);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setModalForm((prev) => ({
          ...prev,
          imagePreview: (ev.target?.result as string) ?? "",
          imageFile: file,
        }));
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const removeImage = useCallback(() => {
    setModalForm((prev) => ({
      ...prev,
      imagePreview: "",
      imageFile: null,
    }));
  }, []);

  const handleModalSubmit = useCallback(async () => {
    if (!modalForm.title.trim()) {
      setTitleError(true);
      titleRef.current?.focus();
      setTimeout(() => setTitleError(false), 2000);
      return;
    }

    if (!authUser?.user_id) {
      await Swal.fire({
        title: "ต้องเข้าสู่ระบบ",
        text: "กรุณาเข้าสู่ระบบก่อนสร้างนิทรรศการ",
        icon: "warning",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const statusMap: Record<ModalStatus, string> = {
      active: "ongoing",
      upcoming: "published",
      ended: "ended",
    };

    try {
      const res = await createExh({
        title: modalForm.title.trim(),
        start_date: toApiDateTime(modalForm.startDate),
        end_date: toApiDateTime(modalForm.endDate),
        location: modalForm.location || undefined,
        organizer_name: modalForm.organizer || "",
        description: modalForm.description || undefined,
        status: modalForm.status ? statusMap[modalForm.status] : "draft",
        file: modalForm.imageFile ?? undefined,
      });

      closeModal();
      await Swal.fire({
        title: "สร้างนิทรรศการเรียบร้อย",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate(`/exhibitions/${res.id}`);
    } catch (error) {
      console.error("Failed to create exhibition", error);
      await Swal.fire({
        title: "สร้างไม่สำเร็จ",
        text: "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  }, [modalForm, authUser, createExh, closeModal, navigate]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  const handleSelect = (id: string) => {
    navigate(`/exhibitions/${id}?view=true`);
  };

  const handleEdit = (id: string) => {
    navigate(`/exhibitions/${id}?edit=true`);
  };

  const handleDelete = async (id: string) => {
    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบงานนี้หรือไม่?",
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
      await deleteExhibitionAsync(id);
      await Swal.fire({
        title: "ลบนิทรรศการเรียบร้อย",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      console.error("Failed to delete exhibition", error);
      await Swal.fire({
        title: "ลบไม่สำเร็จ กรุณาลองใหม่",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <div className={styles.page}>
      <HeaderBar
        active="exhibition_unit"
        onLoginClick={() => navigate("/login")}
      />

      <div className={styles.container}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>จัดการนิทรรศการ</h1>
            <p className={styles.pageSubtitle}>
              จัดการและติดตามนิทรรศการทั้งหมดของคุณ
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>ทั้งหมด</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
          <div className={`${styles.statCard} ${styles.statSuccess}`}>
            <div className={styles.statLabel}>กำลังจัด</div>
            <div className={styles.statValue}>{stats.ongoing}</div>
          </div>
          <div className={`${styles.statCard} ${styles.statAccent}`}>
            <div className={styles.statLabel}>เผยแพร่</div>
            <div className={styles.statValue}>{stats.published}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>จบงาน</div>
            <div className={styles.statValue}>{stats.ended}</div>
          </div>
        </div>

        {/* Toolbar: search + filter chips */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="ค้นหานิทรรศการ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterChips}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.chip}${statusFilter === opt.value ? ` ${styles.chipActive}` : ""}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exhibition grid */}
        <div className={styles.grid}>
          {isLoading && (
            <div className={styles.loading}>Loading exhibitions...</div>
          )}
          {isError && (
            <div className={styles.error}>Failed to load exhibitions</div>
          )}
          {!isLoading && !isError && (
            <ExhibitionList
              items={filtered}
              onSelect={handleSelect}
              onEdit={isAuthenticated ? handleEdit : undefined}
              onDelete={isAuthenticated ? handleDelete : undefined}
            />
          )}
          {isDeleting && <div className={styles.loading}>กำลังลบ...</div>}
        </div>
      </div>

      {isAuthenticated && (
        <FloatingButton
          label="เพิ่มนิทรรศการ"
          ariaLabel="เพิ่มนิทรรศการ"
          onClick={openAddModal}
        />
      )}

      {/* ── Add Exhibition Modal ── */}
      <div
        className={`${styles.modalOverlay}${modalOpen ? ` ${styles.modalOverlayOpen}` : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className={styles.modal}>
          {/* Modal header */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>เพิ่มนิทรรศการใหม่</h2>
            <button
              type="button"
              className={styles.modalClose}
              onClick={closeModal}
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal body */}
          <div className={styles.modalBody}>
            {/* Title */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                ชื่องานนิทรรศการ <span className={styles.req}>*</span>
              </label>
              <input
                ref={titleRef}
                className={`${styles.formInput}${titleError ? ` ${styles.formInputError}` : ""}`}
                type="text"
                placeholder="เช่น AI Technology Expo 2026"
                value={modalForm.title}
                onChange={(e) => updateForm("title", e.target.value)}
              />
            </div>

            {/* Status */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                สถานะ <span className={styles.req}>*</span>
              </label>
              <div className={styles.statusOptions}>
                <button
                  type="button"
                  className={`${styles.statusOption}${modalForm.status === "active" ? ` ${styles.statusActive}` : ""}`}
                  onClick={() => selectStatus("active")}
                >
                  <span className={`${styles.sDot} ${styles.sDotActive}`} />
                  กำลังจัด
                </button>
                <button
                  type="button"
                  className={`${styles.statusOption}${modalForm.status === "upcoming" ? ` ${styles.statusUpcoming}` : ""}`}
                  onClick={() => selectStatus("upcoming")}
                >
                  <span className={`${styles.sDot} ${styles.sDotUpcoming}`} />
                  กำลังจะมา
                </button>
                <button
                  type="button"
                  className={`${styles.statusOption}${modalForm.status === "ended" ? ` ${styles.statusEnded}` : ""}`}
                  onClick={() => selectStatus("ended")}
                >
                  <span className={`${styles.sDot} ${styles.sDotEnded}`} />
                  จบงาน
                </button>
              </div>
            </div>

            <div className={styles.formDivider} />
            <div className={styles.formSectionTitle}>ช่วงเวลา</div>

            {/* Date row */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  วันเริ่มต้น <span className={styles.req}>*</span>
                </label>
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={modalForm.startDate}
                  onChange={(e) => updateForm("startDate", e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  วันสิ้นสุด <span className={styles.req}>*</span>
                </label>
                <input
                  className={styles.formInput}
                  type="datetime-local"
                  value={modalForm.endDate}
                  onChange={(e) => updateForm("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formDivider} />
            <div className={styles.formSectionTitle}>รายละเอียด</div>

            {/* Location */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>สถานที่จัดงาน</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="เช่น Bangkok Convention Center"
                value={modalForm.location}
                onChange={(e) => updateForm("location", e.target.value)}
              />
            </div>

            {/* Organizer */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ผู้จัดงาน</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="ชื่อผู้จัดงานหรือองค์กร"
                value={modalForm.organizer}
                onChange={(e) => updateForm("organizer", e.target.value)}
              />
            </div>

            {/* Image upload */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ไฟล์รูปภาพ (ถ้ามี)</label>
              {modalForm.imagePreview ? (
                <div className={styles.imgPrevBox}>
                  <img
                    className={styles.imgPrev}
                    src={modalForm.imagePreview}
                    alt="preview"
                  />
                  <button
                    type="button"
                    className={styles.imgRemove}
                    onClick={removeImage}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className={styles.imgUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className={styles.imgUploadInput}
                  />
                  <div className={styles.uploadIcon}>
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M3 14l4-4 3 3 3-4 4 5" />
                      <rect x="1" y="3" width="18" height="14" rx="2" />
                    </svg>
                  </div>
                  <div className={styles.uploadText}>คลิกหรือลากไฟล์มาวาง</div>
                  <div className={styles.uploadHint}>
                    JPG, PNG, WEBP — สูงสุด 5MB
                  </div>
                </label>
              )}
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>รายละเอียด</label>
              <textarea
                className={styles.formTextarea}
                placeholder="รายละเอียดเพิ่มเติมของนิทรรศการ"
                value={modalForm.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
            </div>
          </div>

          {/* Modal footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={closeModal}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              className={styles.btnSave}
              onClick={handleModalSubmit}
              disabled={isCreating}
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M2 7.5l3.5 3.5 7-7" />
              </svg>
              {isCreating ? "กำลังสร้าง..." : "สร้างนิทรรศการ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
