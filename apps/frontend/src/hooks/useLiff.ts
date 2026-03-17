import liff from "@line/liff";
import { useCallback, useEffect, useState } from "react";
import { LIFF_CONFIG, type LiffAppType } from "../config/liff";
import { handleLiffError, performLogout } from "../utils/liffErrorHandler";

// Check if LIFF mock mode is enabled
export const isLiffMockEnabled = (): boolean => {
  return import.meta.env.LIFF_MOCK === "true";
};

// Get mock LINE user ID
export const getMockLineUserId = (): string | null => {
  return import.meta.env.VITE_MOCK_LINE_USER_ID || null;
};

export type LiffState<T> =
  | { status: "initializing" }
  | { status: "not_logged_in" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

interface UseLiffOptions<T> {
  liffApp: LiffAppType;
  fetchData: () => Promise<T>;
  dependencies?: unknown[];
}

export function useLiff<T>({ liffApp, fetchData }: UseLiffOptions<T>) {
  const [state, setState] = useState<LiffState<T>>({ status: "initializing" });

  const fetch = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const data = await fetchData();
      setState({ status: "success", data });
    } catch (error) {
      const errorResult = handleLiffError(error, "Failed to load data");

      if (errorResult.shouldLogout) {
        setState({ status: "not_logged_in" });
        performLogout();
        return;
      }

      setState({ status: "error", message: errorResult.message });
    }
  }, [fetchData]);

  const initializeLiff = useCallback(async () => {
    // If mock mode is enabled, skip LIFF initialization
    if (isLiffMockEnabled()) {
      const mockUserId = getMockLineUserId();
      if (!mockUserId) {
        setState({
          status: "error",
          message:
            "LIFF Mock mode enabled but VITE_MOCK_LINE_USER_ID is not set",
        });
        return;
      }
      await fetch();
      return;
    }

    try {
      // Check if LIFF is already initialized
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG[liffApp] });
      }

      if (!liff.isLoggedIn()) {
        setState({ status: "not_logged_in" });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      await fetch();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "LIFF Init Failed",
      });
    }
  }, [liffApp, fetch]);

  useEffect(() => {
    initializeLiff();
  }, [initializeLiff]);

  return {
    state,
    refetch: fetch,
    initializeLiff,
  };
}
