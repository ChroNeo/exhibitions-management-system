import { z } from "zod";

// Zod Schemas
export const UserDropdownOptionSchema = z.object({
  value: z.number().int().positive(),
  label: z.string().min(1),
});

// Type exports (inferred from Zod schemas)
export type UserDropdownOption = z.infer<typeof UserDropdownOptionSchema>;
