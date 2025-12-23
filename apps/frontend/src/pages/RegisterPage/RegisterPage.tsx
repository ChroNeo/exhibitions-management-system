import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import styles from "./RegisterPage.module.css";
import { IoMdCheckboxOutline } from "react-icons/io";
import Swal from "sweetalert2";
import { useRegisterForExhibition } from "../../hook/useRegisterForExhibition";

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

  // Check Exhibition ID
  useEffect(() => {
    if (!exhibitionId) {
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
  }, [exhibitionId, navigate, closeWindow]);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const onChangeRole = (r: Role) => {
    setRole(r);
    if (r === "VISITOR") setForm((s) => ({ ...s, code: "" })); // ล้าง code เมื่อไม่ใช่ STAFF
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
          <form onSubmit={onSubmit} className={styles.card}>
            <label>ชื่อ</label>
            <input
              className={styles.textInput}
              value={form.name}
              onChange={set("name")}
              placeholder="ชื่อจริง"
              required
            />

            <div className={styles.row}>
              <div className={styles.col}>
                <label>เพศ</label>
                <select
                  className={styles.textInput}
                  value={form.gender}
                  onChange={set("gender")}
                  required
                >
                  <option value="" disabled>เลือกเพศ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
              <div className={styles.col}>
                <label>วันเกิด</label>
                <input
                  type="date"
                  className={styles.textInput}
                  value={form.birthDate}
                  onChange={set("birthDate")}
                />
              </div>
            </div>

            <label>อีเมล</label>
            <input
              type="email"
              className={styles.textInput}
              value={form.email}
              onChange={set("email")}
              placeholder="email@example.com"
            />

            <label>โทรศัพท์</label>
            <input
              className={styles.textInput}
              value={form.phone}
              onChange={set("phone")}
              placeholder="เช่น 0891234567"
            />

            <div className={styles.roleSection}>
              <span className={styles.roleLabel}>รายละเอียด</span>
              <div className={styles.radioGroup}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "VISITOR"}
                    onChange={() => onChangeRole("VISITOR")}
                  />
                  Visitors
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === "STAFF"}
                    onChange={() => onChangeRole("STAFF")}
                  />
                  Staff
                </label>
              </div>
            </div>

            {role === "STAFF" && (
              <>
                <label>Code</label>
                <input
                  className={styles.textInput}
                  value={form.code}
                  onChange={set("code")}
                  placeholder="กรอกรหัส Staff"
                  required
                />
              </>
            )}

            <div className={styles.actions}>
              <button
                type="submit"
                className={`${styles.btn} ${styles.confirm}`}
                disabled={isPending}
              >
                <IoMdCheckboxOutline className={styles.icon} />
                <span>ยืนยัน</span>
              </button>

              <button
                type="button"
                onClick={() => !closeWindow() && navigate(-1)}
                className={`${styles.btn} ${styles.cancel}`}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </Panel>
      </main>
    </>
  );
}
