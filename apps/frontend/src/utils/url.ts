const RAW_BASE =
  import.meta.env.VITE_UPLOAD_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:3001/api/v1";

let BASE_ORIGIN: string;
try {
  const parsed = new URL(RAW_BASE);
  BASE_ORIGIN = `${parsed.protocol}//${parsed.host}`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_err) {
  BASE_ORIGIN = RAW_BASE.replace(/\/[^/]*$/, "");
  if (!/^https?:\/\//i.test(BASE_ORIGIN)) {
    BASE_ORIGIN = `http://${BASE_ORIGIN.replace(/^\/*/, "")}`;
  }
}

export function toFileUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  let clean = pathOrUrl.trim().replace(/\\/g, "/");
  if (!clean) return "";

  if (!clean.startsWith("/")) {
    clean = clean.startsWith("uploads/") ? `/${clean}` : `/uploads/${clean.replace(/^\/*/, "")}`;
  }

  return `${BASE_ORIGIN}${clean}`;
}
