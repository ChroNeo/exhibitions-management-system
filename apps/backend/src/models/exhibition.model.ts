// exhibition.model.ts
import { z } from "zod";

export const ExhibitionSchema = z.object({
  exhibition_id: z.number(),
  exhibition_code: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  description_delta: z.any().nullable().optional(), // เป็น JSON object (Quill Delta format)
  start_date: z.string(),
  end_date: z.string(),
  location: z.string().nullable().optional(),
  organizer_name: z.string(),
  picture_path: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "ongoing", "ended", "archived"]).default("draft"),
  created_by: z.number(),
  updated_by: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  archived_at: z.string().nullable().optional(),
});

// สร้าง Schema สำหรับขาเข้า (Request Body) โดยตัด field ที่เป็น System generate ออก
export const CreateExhibitionSchema = ExhibitionSchema.omit({
  exhibition_id: true,
  exhibition_code: true,   // Gen เองหลังบ้าน
  created_by: true,        // ดึงจาก Token
  updated_by: true,        // System generated
  picture_path: true,      // จัดการแยกใน upload
  created_at: true,        // System generated
  updated_at: true,        // System generated
  archived_at: true,       // System generated
});

export const UpdateExhibitionSchema = CreateExhibitionSchema.partial(); // ทำให้ทุก field เป็น optional

export type Exhibition = z.infer<typeof ExhibitionSchema>;