import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import styles from "./RegisterPage.module.css";
import { IoMdCheckboxOutline } from "react-icons/io";
import Swal from "sweetalert2";
import { useRegisterForExhibition } from "../../hook/useRegisterForExhibition";

type Role = "VISITOR" | "STAFF";

export default function RegisterPage() {
  const { id: exhibitionId } = useParams();
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
  const { mutateAsync: registerForExhibition, isPending } = useRegisterForExhibition();

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const onChangeRole = (r: Role) => {
    setRole(r);
    if (r === "VISITOR") setForm((s) => ({ ...s, code: "" })); // ล้าง code เมื่อไม่ใช่ STAFF
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibitionId) {
      await Swal.fire({
        title: "ไม่พบรหัสนิทรรศการ",
        text: "กรุณากลับไปเลือกนิทรรศการอีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    try {
      await registerForExhibition({
        exhibitionId,
        name: form.name,
        gender: form.gender,
        birthDate: form.birthDate,
        email: form.email,
        phone: form.phone,
        role,
        code: form.code,
      });
      await Swal.fire({
        title: "ลงทะเบียนสำเร็จ!",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate(-1);
    } catch (error) {
      await Swal.fire({
        title: "ลงทะเบียนไม่สำเร็จ",
        text:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <>
      <HeaderBar />
      <main className={styles.container}>
        <Panel title="ลงทะเบียน" onBack={() => navigate(-1)}>
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
                <input
                  className={styles.textInput}
                  value={form.gender}
                  onChange={set("gender")}
                  placeholder="ชาย / หญิง"
                />
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
                onClick={() => navigate(-1)}
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
