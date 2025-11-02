import { useEffect, useState } from "react";
import { loadAuth, type StoredAuth } from "../utils/authStorage";

type AuthUser = StoredAuth["user"];

export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(() => loadAuth()?.user ?? null);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(loadAuth()?.user ?? null);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth-change", handleAuthChange);
      window.addEventListener("storage", handleAuthChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-change", handleAuthChange);
        window.removeEventListener("storage", handleAuthChange);
      }
    };
  }, []);

  return user;
}
