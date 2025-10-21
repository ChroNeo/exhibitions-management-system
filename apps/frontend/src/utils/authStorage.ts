export const AUTH_STORAGE_KEY = "exhibition-auth";

export type StoredAuth = {
  token: string;
  tokenType: string;
  expiresAt: number;
  user: {
    user_id: number;
    username: string;
    email: string | null;
    role: string;
  };
};

function readFrom(storage: Storage, key: string): StoredAuth | null {
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredAuth | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.token || typeof parsed.token !== "string") return null;
    if (!parsed.tokenType || typeof parsed.tokenType !== "string") return null;

    if (typeof parsed.expiresAt === "number" && parsed.expiresAt > 0) {
      if (Date.now() >= parsed.expiresAt) {
        storage.removeItem(key);
        return null;
      }
    }

    return parsed;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function getStores(): Storage[] {
  if (typeof window === "undefined") return [];
  const stores: Storage[] = [];
  try {
    stores.push(window.localStorage);
  } catch {
    // ignore
  }
  try {
    stores.push(window.sessionStorage);
  } catch {
    // ignore
  }
  return stores;
}

export function loadAuth(): StoredAuth | null {
  for (const store of getStores()) {
    const value = readFrom(store, AUTH_STORAGE_KEY);
    if (value) return value;
  }
  return null;
}

export function persistAuth(auth: StoredAuth, remember: boolean): void {
  if (typeof window === "undefined") return;

  try {
    const primary = remember ? window.localStorage : window.sessionStorage;
    const secondary = remember ? window.sessionStorage : window.localStorage;
    const payload = JSON.stringify(auth);

    primary.setItem(AUTH_STORAGE_KEY, payload);
    secondary.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event("auth-change"));
  } catch (error) {
    console.error("Failed to persist auth token", error);
  }
}

export function clearAuth(): void {
  for (const store of getStores()) {
    try {
      store.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"));
  }
}
