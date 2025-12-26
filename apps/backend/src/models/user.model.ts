import { z } from "zod";

// Zod Schemas
export const UserDropdownOptionSchema = z.object({
  value: z.number().int().positive(),
  label: z.string().min(1),
});

export const ListUsersQuerySchema = z.object({
  role: z.enum(["staff", "user"]).optional(),
});

// Type exports (inferred from Zod schemas)
export type UserDropdownOption = z.infer<typeof UserDropdownOptionSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
