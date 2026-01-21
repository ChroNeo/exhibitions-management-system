import type {
  CertificateTemplate,
  CreateCertificateTemplatePayload,
  UpdateCertificateTemplatePayload,
} from "../types/certificate";
import { loadAuth } from "../utils/authStorage";

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
  exhibitionId: string | number
): Promise<CertificateTemplate | null> {
  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificate-template`
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
  payload: CreateCertificateTemplatePayload
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
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "สร้าง Certificate Template ไม่สำเร็จ");
  }

  return res.json();
}

export async function updateCertificateTemplate(
  exhibitionId: string | number,
  payload: UpdateCertificateTemplatePayload
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
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "อัปเดต Certificate Template ไม่สำเร็จ");
  }

  return res.json();
}

export async function deleteCertificateTemplate(
  exhibitionId: string | number
): Promise<void> {
  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificate-template`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error("ลบ Certificate Template ไม่สำเร็จ");
  }
}

// service/certificate.service.ts (หรือไฟล์ที่คุณเก็บไว้)
export async function downloadCertificate(
  exhibitionId: string | number,
  userId: string 
): Promise<Blob> {
  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificates/${userId}/download`
  );

  if (res.status === 404) {
    throw new Error("ไม่พบข้อมูลการลงทะเบียน หรือยังไม่มีใบประกาศนียบัตร");
  }

  if (!res.ok) {
    throw new Error("ดาวน์โหลดใบประกาศนียบัตรไม่สำเร็จ");
  }

  return res.blob();
}

export function getCertificateDownloadUrl(
  exhibitionId: string | number,
  userId: string
): string {
  return `${BASE}/exhibitions/${exhibitionId}/certificates/${userId}/download`;
}

export interface CertificatePreviewData {
  template: CertificateTemplate;
  participantName: string;
}

export async function fetchCertificatePreview(
  exhibitionId: string | number,
  userId: string | number
): Promise<CertificatePreviewData> {
  const res = await fetch(
    `${BASE}/exhibitions/${exhibitionId}/certificates/${userId}/preview`
  );

  if (res.status === 404) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "ไม่พบข้อมูลเกียรติบัตร");
  }

  if (!res.ok) {
    throw new Error("ไม่สามารถโหลดข้อมูลเกียรติบัตรได้");
  }

  return res.json();
}
