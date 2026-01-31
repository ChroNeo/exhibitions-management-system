import { z } from "zod";

export const VisitorSchema = z.object({
  user_id: z.number(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  picture_url: z.string().nullable(),
  registration_count: z.number(),
});

export const VisitorListSchema = z.array(VisitorSchema);

export const VisitorDetailSchema = z.object({
  user_id: z.number(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  gender: z.string().nullable(),
  birthdate: z.string().nullable(),
  picture_url: z.string().nullable(),
});

export const VisitorExhibitionSchema = z.object({
  exhibition_id: z.number(),
  exhibition_code: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  registered_at: z.string().nullable(),
  total_units: z.number(),
  checked_in_units: z.number(),
});

export const VisitorExhibitionListSchema = z.array(VisitorExhibitionSchema);

export const CheckinRecordSchema = z.object({
  checkin_id: z.number(),
  unit_id: z.number(),
  unit_name: z.string(),
  unit_type: z.string(),
  checkin_at: z.string().nullable(),
});

export const CheckinRecordListSchema = z.array(CheckinRecordSchema);

export const UserIdParam = z.object({
  userId: z.coerce.number(),
});

export const UserExhibitionParams = z.object({
  userId: z.coerce.number(),
  exhibitionId: z.coerce.number(),
});

export const ToggleCheckinBody = z.object({
  unit_id: z.number(),
});

export const ToggleCheckinResponse = z.object({
  checked_in: z.boolean(),
  checkin_id: z.number().nullable(),
});

export type Visitor = z.infer<typeof VisitorSchema>;
export type VisitorDetail = z.infer<typeof VisitorDetailSchema>;
export type VisitorExhibition = z.infer<typeof VisitorExhibitionSchema>;
export type CheckinRecord = z.infer<typeof CheckinRecordSchema>;
