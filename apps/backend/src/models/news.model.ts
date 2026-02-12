import z from "zod";
export const AnnouncementSchema = z.object({
  announcement_id: z.number(),
  exhibition_id: z.number(),
  topic: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  is_active: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const AnnoucncementsPayload = z.object({
  exhibition_id: z.number(),
  topic: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  is_active: z.number().nullable(),
});
export const UpdateAnnouncementPayload = AnnoucncementsPayload.partial();
export const AnnouncementListSchema = z.array(AnnouncementSchema);
export type Announcement = z.infer<typeof AnnouncementSchema>;
export type AnnoucncementsPayloadType = z.infer<typeof AnnoucncementsPayload>;
export type UpdateAnnouncementPayloadType = z.infer<
  typeof UpdateAnnouncementPayload
>;
