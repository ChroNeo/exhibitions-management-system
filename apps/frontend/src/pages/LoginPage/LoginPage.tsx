import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import Panel from "../../components/Panel/Panel";
import styles from "./LoginPage.module.css";
import { useSignIn } from "../../hook/useSignIn";
import { persistAuth } from "../../utils/authStorage";
import Swal from "sweetalert2";

export default function LoginPage() {
  const navigate = useNavigate();
  const { mutateAsync: signIn, isPending } = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const setField =
    (key: "username" | "password" | "remember") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        key === "remember" ? event.target.checked : event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const result = await signIn({
        username: form.username.trim(),
        password: form.password,
      });

      persistAuth(
        {
          token: result.token,
          tokenType: result.token_type,
          expiresAt: Date.now() + result.expires_in * 1000,
          user: result.user,
        },
        form.remember
      );

      await Swal.fire({
        title: "เข้าสู่ระบบสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
      navigate("/");
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "เกิดข้อผิดพลาด";
      setError(message);
      await Swal.fire({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: message,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
  };

  return (
    <>
      <HeaderBar />
      <main className={styles.container}>
        <Panel title="เข้าสู่ระบบ" onBack={() => navigate(-1)}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <label className={styles.label} htmlFor="login-username">
              ชื่อผู้ใช้
            </label>
            <input
              id="login-username"
              type="text"
              className={styles.input}
              placeholder="organizer01"
              value={form.username}
              onChange={setField("username")}
              autoComplete="username"
              required
            />

            <label className={styles.label} htmlFor="login-password">
              รหัสผ่าน
            </label>
            <input
              id="login-password"
              type="password"
              className={styles.input}
              placeholder="********"
              value={form.password}
              onChange={setField("password")}
              autoComplete="current-password"
              required
            />

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.remember}
                onChange={setField("remember")}
              />
              <span>จำฉันไว้ในระบบ</span>
            </label>

            <button
              type="submit"
              className={styles.submit}
              disabled={isPending}
            >
              {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </Panel>
      </main>
    </>
  );
}
