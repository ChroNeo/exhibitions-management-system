import { Navigate } from "react-router-dom";
import { useAuthUser } from "../hooks";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <>{children}</>;
}
