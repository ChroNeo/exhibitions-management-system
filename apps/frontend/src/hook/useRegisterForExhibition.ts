import { useMutation } from "@tanstack/react-query";
import {
  registerForExhibition,
  type RegistrationGender,
  type RegistrationPayload,
  type RegistrationResponse,
} from "../api/registrations";

export type RegisterFormPayload = {
  exhibitionId: string | number;
  name: string;
  gender?: string;
  birthDate?: string;
  email: string;
  phone?: string;
  role: "VISITOR" | "STAFF";
  code?: string;
};

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

  const role = input.role === "STAFF" ? "staff" : "visitor";
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
  };
};

export function useRegisterForExhibition() {
  return useMutation<RegistrationResponse, Error, RegisterFormPayload>({
    mutationFn: (payload) => registerForExhibition(toRegistrationPayload(payload)),
  });
}

