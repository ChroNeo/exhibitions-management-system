import { z } from "zod";

// Zod Schemas for Registration Controller

export const RegistrationInputSchema = z
  .object({
    exhibition_id: z.number().int().positive(),
    full_name: z.string().min(1).trim(),
    gender: z.enum(["male", "female", "other"]).optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "birthdate must be in YYYY-MM-DD format")
      .optional(),
    email: z.email(),
    phone: z.string().min(1).optional(),
    role: z.enum(["visitor", "staff"]),
    unit_code: z.string().min(1).optional(),
    line_user_id: z.string().min(1).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // If role is staff, unit_code is required
      if (data.role === "staff") {
        return !!data.unit_code;
      }
      return true;
    },
    {
      message: "unit_code is required when role is staff",
      path: ["unit_code"],
    }
  );

export const RegistrationResponseSchema = z.object({
  user: z.object({
    user_id: z.number().int().positive(),
    role: z.enum(["user", "staff"]),
  }),
  registration: z.object({
    registration_id: z.number().int().positive(),
    exhibition_id: z.number().int().positive(),
  }),
  staff_linked: z
    .object({
      unit_id: z.number().int().positive(),
      added: z.boolean(),
    })
    .optional(),
});

// Type exports (inferred from Zod schemas)
export type RegistrationInput = z.infer<typeof RegistrationInputSchema>;
export type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;
