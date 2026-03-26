import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import AddExhibitionModal, { type ModalFormData } from "./AddExhibitionModal";
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

const STATUS_MAP: Record<string, string> = {
  active: "ongoing",
  upcoming: "published",
  ended: "ended",
};

export default function ExhibitionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(false);

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

  const openAddModal = useCallback(() => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    document.body.style.overflow = "";
  }, []);

  const handleModalSubmit = useCallback(
    async (form: ModalFormData) => {
      if (!authUser?.user_id) {
        await Swal.fire({
          title: "ต้องเข้าสู่ระบบ",
          text: "กรุณาเข้าสู่ระบบก่อนสร้างนิทรรศการ",
          icon: "warning",
          confirmButtonText: "ตกลง",
        });
        return;
      }

      try {
        const res = await createExh({
          title: form.title.trim(),
          start_date: toApiDateTime(form.startDate),
          end_date: toApiDateTime(form.endDate),
          location: form.location || undefined,
          organizer_name: form.organizer || "",
          description: form.description || undefined,
          status: form.status ? STATUS_MAP[form.status] : "draft",
          file: form.imageFile ?? undefined,
          detailPdfFile: form.pdfFile ?? undefined,
        });

        closeModal();
        await Swal.fire({
          title: "สร้างนิทรรศการเรียบร้อย",
          icon: "success",
          confirmButtonText: "ตกลง",
        });
        navigate(`/exhibitions/${res.id}`);
      } catch {
        await Swal.fire({
          title: "สร้างไม่สำเร็จ",
          text: "กรุณาลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
      }
    },
    [authUser, createExh, closeModal, navigate],
  );

  const handleSelect = (id: string) => {
    navigate(`/exhibitions/${id}`);
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
          <div className={`${styles.statCard} ${styles.statAccent}`}>
            <div className={styles.statLabel}>กำลังจัด</div>
            <div className={styles.statValue}>{stats.ongoing}</div>
          </div>
          <div className={`${styles.statCard} ${styles.statSuccess}`}>
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
      <AddExhibitionModal
        open={modalOpen}
        isCreating={isCreating}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
