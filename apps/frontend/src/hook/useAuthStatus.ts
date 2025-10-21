import { useEffect, useState } from "react";
import { loadAuth } from "../utils/authStorage";

export function useAuthStatus(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(loadAuth())
  );

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(Boolean(loadAuth()));
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

  return isAuthenticated;
}
