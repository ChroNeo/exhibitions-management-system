import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import ExhibitionList from "../../components/exhibition/ExhibitionList";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import {
  useAuthStatus,
  useDeleteExhibition,
  useExhibitions,
} from "../../hooks";
import type { Exhibition } from "../../types/exhibition";
import styles from "./ExManagePage.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "draft", label: "ร่าง" },
  { value: "published", label: "เผยแพร่" },
  { value: "ongoing", label: "กำลังจัด" },
  { value: "ended", label: "จบงาน" },
  { value: "archived", label: "เก็บ" },
];

export default function ExhibitionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const handleAdd = () => {
    navigate("/exhibitions/new");
  };

  const handleSelect = (id: string) => {
    navigate(`/exhibitions/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/exhibitions/${id}/edit`);
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
          {isAuthenticated && (
            <button
              type="button"
              className={`${styles.addBtn} ${styles.desktopAdd}`}
              onClick={handleAdd}
            >
              <Plus size={16} />
              เพิ่มนิทรรศการ
            </button>
          )}
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

      {/* FAB for mobile */}
      {isAuthenticated && (
        <button
          type="button"
          className={styles.fab}
          onClick={handleAdd}
          aria-label="เพิ่มนิทรรศการ"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
