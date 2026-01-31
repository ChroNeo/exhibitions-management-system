import { z } from "zod";

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
