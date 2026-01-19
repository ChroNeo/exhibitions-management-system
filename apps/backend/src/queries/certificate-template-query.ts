import type { ResultSetHeader } from "mysql2";
import type {
  CreateCertificateTemplateInput,
  UpdateCertificateTemplateInput,
} from "../models/certificate-template.model.js";
import { AppError } from "../errors.js";
import { safeQuery } from "../services/dbconn.js";

const CERTIFICATE_TEMPLATE_SELECT = `
  SELECT
    ct.template_id,
    ct.exhibition_id,
    e.exhibition_code,
    e.title AS exhibition_title,
    e.organizer_name,
    ct.background_url,
    ct.layout_config,
    ct.created_at,
    ct.updated_at
  FROM certificate_templates ct
  JOIN exhibitions e ON ct.exhibition_id = e.exhibition_id
`;

export async function getCertificateTemplateByExhibitionId(
  exhibitionId: string | number
): Promise<any | null> {
  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  const rows = await safeQuery(
    `${CERTIFICATE_TEMPLATE_SELECT} WHERE ct.exhibition_id = ? LIMIT 1`,
    [exhibitionId]
  );

  if (!rows.length) {
    return null;
  }

  return rows[0];
}

export async function createCertificateTemplate(
  exhibitionId: string | number,
  payload: CreateCertificateTemplateInput
): Promise<any> {
  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  // Check if exhibition exists
  const exhibitions = await safeQuery(
    `SELECT exhibition_id FROM exhibitions WHERE exhibition_id = ?`,
    [exhibitionId]
  );
  if (!exhibitions.length) {
    throw new AppError("exhibition not found", 404, "NOT_FOUND");
  }

  // Check if template already exists
  const existing = await getCertificateTemplateByExhibitionId(exhibitionId);
  if (existing) {
    throw new AppError(
      "certificate template already exists for this exhibition",
      409,
      "CONFLICT"
    );
  }

  const result = await safeQuery<ResultSetHeader>(
    `INSERT INTO certificate_templates (exhibition_id, background_url, layout_config)
     VALUES (?, ?, ?)`,
    [
      exhibitionId,
      payload.background_url,
      payload.layout_config ? JSON.stringify(payload.layout_config) : null,
    ]
  );

  return getCertificateTemplateByExhibitionId(exhibitionId);
}

export async function updateCertificateTemplate(
  exhibitionId: string | number,
  payload: UpdateCertificateTemplateInput
): Promise<any> {
  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (payload.background_url !== undefined) {
    updates.push("background_url = ?");
    params.push(payload.background_url);
  }

  if (payload.layout_config !== undefined) {
    updates.push("layout_config = ?");
    params.push(
      payload.layout_config ? JSON.stringify(payload.layout_config) : null
    );
  }

  if (!updates.length) {
    throw new AppError("no fields to update", 400, "VALIDATION_ERROR");
  }

  const result = await safeQuery<ResultSetHeader>(
    `UPDATE certificate_templates SET ${updates.join(", ")} WHERE exhibition_id = ?`,
    [...params, exhibitionId]
  );

  if (!result.affectedRows) {
    throw new AppError(
      "certificate template not found for this exhibition",
      404,
      "NOT_FOUND"
    );
  }

  return getCertificateTemplateByExhibitionId(exhibitionId);
}

export async function deleteCertificateTemplate(
  exhibitionId: string | number
): Promise<void> {
  if (!/^\d+$/.test(String(exhibitionId))) {
    throw new AppError("invalid exhibition id", 400, "VALIDATION_ERROR");
  }

  const result = await safeQuery<ResultSetHeader>(
    `DELETE FROM certificate_templates WHERE exhibition_id = ?`,
    [exhibitionId]
  );

  if (!result.affectedRows) {
    throw new AppError(
      "certificate template not found for this exhibition",
      404,
      "NOT_FOUND"
    );
  }
}

export interface CertificateDataForGeneration {
  participant_name: string;
  exhibition_title: string;
  organizer_name: string;
  start_date: string | null;
  end_date: string | null;
}

export async function getRegisteredParticipantName(
  exhibitionId: string | number,
  userId: string | number
): Promise<CertificateDataForGeneration | null> {
  if (!/^\d+$/.test(String(exhibitionId)) || !/^\d+$/.test(String(userId))) {
    throw new AppError("invalid id", 400, "VALIDATION_ERROR");
  }

  const rows = await safeQuery<CertificateDataForGeneration[]>(
    `SELECT u.full_name AS participant_name
      FROM registrations r
      JOIN normal_users u ON r.user_id = u.user_id
      WHERE u.user_id = ? AND r.exhibition_id = ?
      LIMIT 1`,
    [userId, exhibitionId]
  );

  if (!rows.length) {
    return null;
  }

  return rows[0];
}
