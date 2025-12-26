// unit.model.ts
import { z } from "zod";

export const UNIT_TYPES = ["booth", "activity"] as const;

export const UnitSchema = z.object({
  unit_id: z.number(),
  exhibition_id: z.number(),
  unit_name: z.string(),
  unit_type: z.enum(UNIT_TYPES),
  description: z.string().nullable().optional(),
  description_delta: z.string().nullable().optional(),
  staff_user_id: z.number().nullable().optional(),
  staff_name: z.string().nullable().optional(),
  staff_user_ids: z.array(z.number()).optional(),
  staff_names: z.array(z.string()).optional(),
  poster_url: z.string().nullable().optional(),
  detail_pdf_url: z.string().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

// Schema สำหรับ Create Unit (ตัด unit_id, exhibition_id, staff info ออก)
export const CreateUnitSchema = z.object({
  unit_name: z.string(),
  unit_type: z.enum(UNIT_TYPES),
  description: z.string().nullable().optional(),
  description_delta: z.string().nullable().optional(),
  staff_user_id: z.number().nullable().optional(),
  staff_user_ids: z.array(z.number()).optional(),
  poster_url: z.string().nullable().optional(),
  detail_pdf_url: z.string().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

// Schema สำหรับ Update Unit (ทุก field เป็น optional)
export const UpdateUnitSchema = CreateUnitSchema.partial();

export type Unit = z.infer<typeof UnitSchema>;
export type CreateUnitInput = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitInput = z.infer<typeof UpdateUnitSchema>;
