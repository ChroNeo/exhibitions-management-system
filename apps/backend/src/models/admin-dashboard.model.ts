import { z } from "zod";

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
