import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import styles from "./RegisterPage.module.css";
import {
  User,
  Users,
  Calendar,
  Mail,
  Phone,
  IdCard,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import { useRegisterForExhibition } from "./hooks";

type Role = "VISITOR" | "STAFF";

export default function RegisterPage() {
  const { id: exhibitionIdFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const exhibitionIdFromQuery = searchParams.get("exhibition_id");
  const exhibitionId = exhibitionIdFromQuery || exhibitionIdFromParams;
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("VISITOR");
  const [form, setForm] = useState({
    name: "",
    gender: "",
    birthDate: "",
    email: "",
    phone: "",
    code: "",
  });
  const { closeWindow, getAutoFillName, isLiffReady, register, isPending } = useRegisterForExhibition({
    enableLiff: true,
    autoFillName: true
  });

  // Auto-fill name from LINE Profile when ready
  useEffect(() => {
    if (isLiffReady) {
      const autoFillName = getAutoFillName();
      if (autoFillName && !form.name) {
        setForm(prev => ({ ...prev, name: autoFillName }));
      }
    }
  }, [isLiffReady, getAutoFillName, form.name]);

  // Check Exhibition ID (wait for LIFF to be ready first)
  useEffect(() => {
    if (isLiffReady && !exhibitionId) {
      Swal.fire({
        title: "ไม่พบรหัสนิทรรศการ",
        icon: "error",
        confirmButtonText: "ปิด",
      }).then(() => {
        const closed = closeWindow();
        if (!closed) {
          navigate("/");
        }
      });
    }
  }, [isLiffReady, exhibitionId, navigate, closeWindow]);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const onChangeRole = (r: Role) => {
    setRole(r);
    if (r === "VISITOR") setForm((s) => ({ ...s, code: "" }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibitionId) return;

    await register({
      exhibitionId,
      name: form.name,
      gender: form.gender,
      birthDate: form.birthDate,
      email: form.email,
      phone: form.phone,
      role,
      code: form.code,
    });
  };

  if (!exhibitionId) return null;

  return (
    <>
      <HeaderBar />
      <main className={styles.container}>
        <Panel title="ลงทะเบียน" onBack={() => !closeWindow() && navigate(-1)}>
          <p style={{ textAlign: "center", color: "var(--ink-muted)", fontSize: 14, margin: "-4px 0 8px" }}>
            กรอกข้อมูลเพื่อรับสิทธิ์เข้าใช้งาน
          </p>

          <form onSubmit={onSubmit} className={styles.card}>
            {/* Name */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                ชื่อ <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><User size={18} /></span>
                <input
                  className={styles.textInput}
                  value={form.name}
                  onChange={set("name")}
                  placeholder="ชื่อจริง - นามสกุล"
                  required
                />
              </div>
            </div>

            {/* Gender & Birthdate */}
            <div className={styles.row}>
              <div className={styles.col}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    เพศ <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><Users size={18} /></span>
                    <select
                      className={styles.textInput}
                      value={form.gender}
                      onChange={set("gender")}
                      required
                    >
                      <option value="" disabled>เลือกเพศ</option>
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                      <option value="other">ไม่ระบุ</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.col}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    วันเกิด <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><Calendar size={18} /></span>
                    <input
                      type="date"
                      className={styles.textInput}
                      value={form.birthDate}
                      onChange={set("birthDate")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                อีเมล <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Mail size={18} /></span>
                <input
                  type="email"
                  className={styles.textInput}
                  value={form.email}
                  onChange={set("email")}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                โทรศัพท์ <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Phone size={18} /></span>
                <input
                  className={styles.textInput}
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="08X-XXX-XXXX"
                />
              </div>
            </div>

            <div className={styles.divider} />

            {/* Role Selection */}
            <div className={styles.roleSection}>
              <span className={styles.roleLabel}>
                ประเภทผู้ใช้งาน <span className={styles.required}>*</span>
              </span>
              <div className={styles.roleToggle}>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${role === "VISITOR" ? styles.active : ""}`}
                  onClick={() => onChangeRole("VISITOR")}
                >
                  <span className={styles.roleBtnIcon}><IdCard size={18} /></span>
                  <span>Visitors</span>
                </button>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${role === "STAFF" ? styles.active : ""}`}
                  onClick={() => onChangeRole("STAFF")}
                >
                  <span className={styles.roleBtnIcon}><Users size={18} /></span>
                  <span>Staff</span>
                </button>
              </div>
            </div>

            {/* Staff Booth Code */}
            <div className={`${styles.staffSection} ${role === "STAFF" ? styles.visible : styles.hidden}`}>
              <div className={styles.staffInner}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    รหัสบูธประจำตัว <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}><QrCode size={18} /></span>
                    <input
                      className={styles.textInput}
                      value={form.code}
                      onChange={set("code")}
                      placeholder="ระบุรหัสบูธ (เช่น B-01)"
                      required={role === "STAFF"}
                    />
                  </div>
                </div>
                <p className={styles.staffHint}>
                  * สำหรับเจ้าหน้าที่ ต้องระบุรหัสบูธเพื่อยืนยันตัวตน
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => !closeWindow() && navigate(-1)}
                className={`${styles.btn} ${styles.cancel}`}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.confirm}`}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className={styles.spinner} />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>ยืนยัน</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Panel>
      </main>
    </>
  );
}
