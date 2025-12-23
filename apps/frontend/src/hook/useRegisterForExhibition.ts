import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import Swal from "sweetalert2";
import {
  registerForExhibition,
  type RegistrationGender,
  type RegistrationPayload,
  type RegistrationResponse,
  type RegistrationRole,
} from "../api/registrations";

// LIFF Configuration
const LIFF_CONFIG = {
  liffId: "2008498720-2QsaDpSE",
};

export type RegisterFormPayload = {
  exhibitionId: string | number;
  name: string;
  gender?: string;
  birthDate?: string;
  email: string;
  phone?: string;
  role: "VISITOR" | "STAFF";
  code?: string;
  lineUserId?: string;
};

type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export type LiffState =
  | { status: "initializing" }
  | { status: "not_logged_in" }
  | { status: "idle"; profile: LiffProfile | null }
  | { status: "error"; message: string };

const genderMap: Record<string, RegistrationGender> = {
  male: "male",
  m: "male",
  female: "female",
  f: "female",
  woman: "female",
  man: "male",
  other: "other",
  o: "other",
};

const normaliseString = (value: string | undefined): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const toGender = (value: string | undefined): RegistrationGender | undefined => {
  const normalised = normaliseString(value);
  if (!normalised) return undefined;
  const mapped = genderMap[normalised.toLowerCase()];
  return mapped;
};

const toRegistrationPayload = (input: RegisterFormPayload): RegistrationPayload => {
  const exhibitionId = Number(input.exhibitionId);
  if (!Number.isFinite(exhibitionId) || exhibitionId <= 0) {
    throw new Error("Invalid exhibition id");
  }

  const fullName = normaliseString(input.name);
  if (!fullName) {
    throw new Error("Name is required");
  }

  const email = normaliseString(input.email);
  if (!email) {
    throw new Error("Email is required");
  }

  const role: RegistrationRole = input.role === "STAFF" ? "staff" : "visitor";
  const unitCode = normaliseString(input.code);
  if (role === "staff" && !unitCode) {
    throw new Error("Staff code is required");
  }

  return {
    exhibition_id: exhibitionId,
    full_name: fullName,
    gender: toGender(input.gender),
    birthdate: normaliseString(input.birthDate),
    email,
    phone: normaliseString(input.phone),
    role,
    ...(role === "staff" && unitCode ? { unit_code: unitCode } : {}),
    ...(input.lineUserId ? { line_user_id: input.lineUserId } : {}),
  };
};

interface UseRegisterForExhibitionOptions {
  enableLiff?: boolean;
  autoFillName?: boolean;
}

export function useRegisterForExhibition(options: UseRegisterForExhibitionOptions = {}) {
  const { enableLiff = false, autoFillName = true } = options;
  const navigate = useNavigate();
  const [liffState, setLiffState] = useState<LiffState>(
    enableLiff ? { status: "initializing" } : { status: "idle", profile: null }
  );

  const mutation = useMutation<RegistrationResponse, Error, RegisterFormPayload>({
    mutationFn: (payload) => registerForExhibition(toRegistrationPayload(payload)),
  });

  // Initialize LIFF
  const initializeLiff = useCallback(async () => {
    if (!enableLiff) return;

    try {
      // Check if LIFF is already initialized
      if (!liff.id) {
        await liff.init({ liffId: LIFF_CONFIG.liffId });
      }

      if (!liff.isLoggedIn()) {
        setLiffState({ status: "not_logged_in" });
        liff.login({ redirectUri: window.location.href });
        return;
      }

      // Try to get profile, but continue if permission is not granted
      try {
        const profile = await liff.getProfile();
        setLiffState({ status: "idle", profile });
      } catch (profileError) {
        console.warn("Cannot access LINE profile (missing 'profile' scope):", profileError);
        setLiffState({ status: "idle", profile: null });
      }
    } catch (error) {
      console.error("LIFF init error:", error);
      setLiffState({
        status: "error",
        message: error instanceof Error ? error.message : "LIFF Init Failed",
      });
    }
  }, [enableLiff]);

  // Close LIFF window
  const closeWindow = useCallback(() => {
    if (liff.isInClient()) {
      liff.closeWindow();
      return true;
    }
    return false;
  }, []);

  // Get auto-fill name
  const getAutoFillName = useCallback(() => {
    if (autoFillName && liffState.status === "idle" && liffState.profile) {
      return liffState.profile.displayName;
    }
    return "";
  }, [autoFillName, liffState]);

  // Register with LIFF integration
  const register = useCallback(
    async (payload: RegisterFormPayload) => {
      try {
        // Add LINE user ID if LIFF is enabled and user is logged in
        let finalPayload = payload;
        if (enableLiff && liffState.status === "idle" && liffState.profile) {
          finalPayload = {
            ...payload,
            lineUserId: liffState.profile.userId,
          };
        }

        await mutation.mutateAsync(finalPayload);

        await Swal.fire({
          title: "ลงทะเบียนสำเร็จ!",
          icon: "success",
          confirmButtonText: "ตกลง",
        });

        // Close LIFF window or navigate back
        if (enableLiff && liff.isInClient()) {
          liff.closeWindow();
        } else {
          navigate(-1);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

        await Swal.fire({
          title: "ลงทะเบียนไม่สำเร็จ",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "ตกลง",
        });

        throw error;
      }
    },
    [mutation, navigate, enableLiff, liffState]
  );

  // Initialize LIFF on mount if enabled
  useEffect(() => {
    if (enableLiff) {
      initializeLiff();
    }
  }, [enableLiff, initializeLiff]);

  return {
    // Original mutation return
    ...mutation,
    // LIFF-specific features
    liffState,
    initializeLiff,
    closeWindow,
    getAutoFillName,
    register,
    isLiffReady: liffState.status === "idle",
    isLiffInitializing: liffState.status === "initializing",
    isLiffError: liffState.status === "error",
    profile: liffState.status === "idle" ? liffState.profile : null,
    liffError: liffState.status === "error" ? liffState.message : null,
  };
}

