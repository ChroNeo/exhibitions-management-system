import { useNavigate } from "react-router-dom";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import HeaderBar from "../../components/HeaderBar/HeaderBar";
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateUserRole,
  useDeleteUser,
} from "./hooks/useAdminUsers";
import styles from "./UserManagementPage.module.css";

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { data: users, isLoading, error } = useAdminUsers();
  const createUser = useCreateAdminUser();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const handleAdd = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เพิ่มผู้ใช้ใหม่",
      html:
        '<input id="swal-username" class="swal2-input" placeholder="Username">' +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Password">' +
        '<input id="swal-email" class="swal2-input" placeholder="Email (optional)">' +
        '<select id="swal-role" class="swal2-select" style="margin-top:12px;padding:8px 12px;border:1px solid #d9d9d9;border-radius:4px;width:100%;max-width:264px;">' +
        '  <option value="admin">Admin</option>' +
        '  <option value="organizer" selected>Organizer</option>' +
        "</select>",
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "สร้าง",
      cancelButtonText: "ยกเลิก",
      preConfirm: () => {
        const username = (
          document.getElementById("swal-username") as HTMLInputElement
        ).value.trim();
        const password = (
          document.getElementById("swal-password") as HTMLInputElement
        ).value;
        const email =
          (
            document.getElementById("swal-email") as HTMLInputElement
          ).value.trim() || null;
        const role = (
          document.getElementById("swal-role") as HTMLSelectElement
        ).value as "admin" | "organizer";

        if (!username || !password) {
          Swal.showValidationMessage("กรุณากรอก Username และ Password");
          return null;
        }
        if (password.length < 6) {
          Swal.showValidationMessage("Password ต้องมีอย่างน้อย 6 ตัวอักษร");
          return null;
        }
        return { username, password, email, role };
      },
    });

    if (!formValues) return;

    try {
      await createUser.mutateAsync(formValues);
      Swal.fire("สำเร็จ", "สร้างผู้ใช้เรียบร้อยแล้ว", "success");
    } catch (err: any) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถสร้างผู้ใช้ได้",
        "error"
      );
    }
  };

  const handleRoleToggle = async (
    userId: number,
    currentRole: string,
    username: string
  ) => {
    const newRole = currentRole === "admin" ? "organizer" : "admin";
    const { isConfirmed } = await Swal.fire({
      title: "เปลี่ยน Role",
      text: `เปลี่ยน ${username} จาก "${currentRole}" เป็น "${newRole}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (!isConfirmed) return;

    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      Swal.fire("สำเร็จ", "เปลี่ยน Role เรียบร้อยแล้ว", "success");
    } catch (err: any) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถเปลี่ยน Role ได้",
        "error"
      );
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    const { isConfirmed } = await Swal.fire({
      title: "ลบผู้ใช้",
      text: `คุณแน่ใจหรือไม่ที่จะลบ "${username}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (!isConfirmed) return;

    try {
      await deleteUser.mutateAsync(userId);
      Swal.fire("สำเร็จ", "ลบผู้ใช้เรียบร้อยแล้ว", "success");
    } catch (err: any) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบผู้ใช้ได้",
        "error"
      );
    }
  };

  return (
    <>
      <HeaderBar
        active="admin"
        onLoginClick={() => navigate("/login")}
      />
      <div className="container">
        <div className={styles.wrapper}>
          <div className={styles.toolbar}>
            <h1 className={styles.title}>จัดการผู้ใช้งาน</h1>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleAdd}
            >
              <UserPlus size={18} />
              เพิ่มผู้ใช้
            </button>
          </div>

          {isLoading && <p className={styles.loading}>กำลังโหลด...</p>}
          {error && (
            <p className={styles.error}>
              ไม่สามารถโหลดข้อมูลได้: {(error as Error).message}
            </p>
          )}

          {!isLoading && !error && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users && users.length > 0 ? (
                    users.map((u) => (
                      <tr key={u.user_id}>
                        <td>{u.user_id}</td>
                        <td>{u.username}</td>
                        <td>{u.email ?? "—"}</td>
                        <td>
                          <span
                            className={`${styles.roleBadge} ${
                              u.role === "admin"
                                ? styles.roleAdmin
                                : styles.roleOrganizer
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>{u.last_login_at ?? "—"}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                              title="เปลี่ยน Role"
                              onClick={() =>
                                handleRoleToggle(
                                  u.user_id,
                                  u.role,
                                  u.username
                                )
                              }
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              title="ลบผู้ใช้"
                              onClick={() =>
                                handleDelete(u.user_id, u.username)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className={styles.emptyRow}>
                      <td colSpan={6}>ไม่พบข้อมูลผู้ใช้</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
