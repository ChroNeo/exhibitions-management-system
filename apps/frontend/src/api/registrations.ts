import { fetchWithNgrokBypass } from "../utils/fetch";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

export type RegistrationRole = "visitor" | "staff";
export type RegistrationGender = "male" | "female" | "other";

export type RegistrationPayload = {
  exhibition_id: number;
  full_name: string;
  gender?: RegistrationGender;
  birthdate?: string;
  email: string;
  phone?: string;
  role: RegistrationRole;
  unit_code?: string;
};

export type RegistrationResponse = {
  user: {
    user_id: number;
    role: "user" | "staff";
  };
  registration: {
    registration_id: number;
    exhibition_id: number;
  };
  staff_linked?: {
    unit_id: number;
    added: boolean;
  };
};

export async function registerForExhibition(
  payload: RegistrationPayload
): Promise<RegistrationResponse> {
  const response = await fetchWithNgrokBypass(`${BASE}/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Registration failed";
    try {
      const errorBody: unknown = await response.json();
      if (
        errorBody &&
        typeof errorBody === "object" &&
        "message" in errorBody &&
        typeof errorBody.message === "string"
      ) {
        message = errorBody.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<RegistrationResponse>;
}

