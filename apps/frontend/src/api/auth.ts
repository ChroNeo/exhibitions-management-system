const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

export type SignInPayload = {
  username: string;
  password: string;
};

export type SignInResponse = {
  token: string;
  token_type: "Bearer";
  expires_in: number;
  user: {
    user_id: number;
    username: string;
    email: string | null;
    role: string;
  };
};

export async function signIn(
  payload: SignInPayload
): Promise<SignInResponse> {
  const response = await fetch(`${BASE}/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "เข้าสู่ระบบไม่สำเร็จ";
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
      // ignore JSON parsing errors; use default message
    }
    throw new Error(message);
  }

  return response.json();
}
