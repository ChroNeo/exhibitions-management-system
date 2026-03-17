import type {
  CertificateTemplate,
  CreateCertificateTemplatePayload,
  UpdateCertificateTemplatePayload,
} from "../types/certificate";
import { loadAuth } from "../utils/authStorage";
import liffClient from "./liffClient";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api/v1";

function getAuthHeaders(): HeadersInit {
  const auth = loadAuth();
  if (auth && auth.token) {
    return {
      Authorization: `${auth.tokenType} ${auth.token}`,
    };
  }
  return {};
}

export async function fetchCertificateTemplate(
  exhibitionId: string | number,
): Promise<CertificateTemplate | null> {
  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificate-template`,
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("ดึงข้อมูล Certificate Template ไม่สำเร็จ");
  }

  return res.json();
}

export async function createCertificateTemplate(
  exhibitionId: string | number,
  payload: CreateCertificateTemplatePayload,
): Promise<CertificateTemplate> {
  const fd = new FormData();
  fd.append("file", payload.file);

  if (payload.layout_config) {
    fd.append("layout_config", JSON.stringify(payload.layout_config));
  }

  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificate-template`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: fd,
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || "สร้าง Certificate Template ไม่สำเร็จ",
    );
  }

  return res.json();
}

export async function updateCertificateTemplate(
  exhibitionId: string | number,
  payload: UpdateCertificateTemplatePayload,
): Promise<CertificateTemplate> {
  const fd = new FormData();

  if (payload.file) {
    fd.append("file", payload.file);
  }

  if (payload.layout_config) {
    fd.append("layout_config", JSON.stringify(payload.layout_config));
  }

  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificate-template`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: fd,
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || "อัปเดต Certificate Template ไม่สำเร็จ",
    );
  }

  return res.json();
}

export async function deleteCertificateTemplate(
  exhibitionId: string | number,
): Promise<void> {
  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificate-template`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );

  if (!res.ok) {
    throw new Error("ลบ Certificate Template ไม่สำเร็จ");
  }
}

// FS2: Download certificate — uses liffClient for LIFF auth, or organizer auth for admin skipValidation
export async function downloadCertificate(
  exhibitionId: string | number,
  userId: string,
  options?: { skipValidation?: boolean },
): Promise<Blob> {
  const params = new URLSearchParams();
  if (options?.skipValidation) {
    params.set("skipValidation", "true");
  }

  const queryString = params.toString();
  const path = `/exhibitions/${exhibitionId}/certificates/${userId}/download${queryString ? `?${queryString}` : ""}`;

  // Admin skip uses organizer auth (JWT), normal uses LIFF auth
  if (options?.skipValidation) {
    const res = await fetch(`${BASE}${path}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 404) {
      throw new Error("ไม่พบข้อมูลการลงทะเบียน หรือยังไม่มีใบประกาศนียบัตร");
    }
    if (!res.ok) {
      throw new Error("ดาวน์โหลดใบประกาศนียบัตรไม่สำเร็จ");
    }
    return res.blob();
  }

  const res = await liffClient.get(path, { responseType: "blob" });
  return res.data;
}

export function getCertificateDownloadUrl(
  exhibitionId: string | number,
  userId: string,
): string {
  return `${BASE}/exhibitions/${exhibitionId}/certificates/${userId}/download`;
}

export interface CertificatePreviewData {
  template: CertificateTemplate;
  participantName: string;
}

// FS2: Preview now requires LIFF auth — use liffClient
export async function fetchCertificatePreview(
  exhibitionId: string | number,
  userId: string | number,
): Promise<CertificatePreviewData> {
  const res = await liffClient.get<CertificatePreviewData>(
    `/exhibitions/${exhibitionId}/certificates/${userId}/preview`,
  );
  return res.data;
}
