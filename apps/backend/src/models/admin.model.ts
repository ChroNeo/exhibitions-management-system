import { z } from "zod";

// ------------------------------------------------------------------ //
//  USERS
// ------------------------------------------------------------------ //

export const OrganizerUserSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  email: z.string().nullable(),
  role: z.string(),
  last_login_at: z.string().nullable(),
});

export const OrganizerUserListSchema = z.array(OrganizerUserSchema);

export const UpdateRoleBody = z.object({
  role: z.enum(["admin", "organizer"]),
});

export const UserIdParam = z.object({
  userId: z.coerce.number(),
});

export type OrganizerUser = z.infer<typeof OrganizerUserSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleBody>;

// ------------------------------------------------------------------ //
//  DASHBOARD
// ------------------------------------------------------------------ //

export const ExhibitionWithStatsSchema = z.object({
  exhibition_id: z.number(),
  exhibition_code: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  location: z.string().nullable(),
  organizer_name: z.string(),
  picture_path: z.string().nullable(),
  total_registrations: z.number(),
});

export const ExhibitionWithStatsListSchema = z.array(ExhibitionWithStatsSchema);

export const RegistrationRowSchema = z.object({
  registration_id: z.number(),
  user_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  registered_at: z.string().nullable(),
});

export const RegistrationListSchema = z.array(RegistrationRowSchema);

export const ExhibitionIdParam = z.object({
  exhibitionId: z.coerce.number(),
});

export type ExhibitionWithStats = z.infer<typeof ExhibitionWithStatsSchema>;
export type RegistrationRow = z.infer<typeof RegistrationRowSchema>;

// ------------------------------------------------------------------ //
//  VISITORS
// ------------------------------------------------------------------ //

export const VisitorSchema = z.object({
  user_id: z.number(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  picture_url: z.string().nullable(),
  registration_count: z.number(),
});

export const VisitorListSchema = z.array(VisitorSchema);

export const VisitorDetailSchema = z.object({
  user_id: z.number(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
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
