import { z } from "zod";

// Zod Schemas
export const SignInSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export const RegisterSchema = z.object({
  username: z.string().min(3, "username must be at least 3 characters"),
  password: z.string().min(6, "password must be at least 6 characters"),
  email: z.union([
    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email must be valid"),
    z.null()
  ]).optional(),
  role: z.enum(["admin", "organizer"]).default("organizer"),
});

export const UserResponseSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  email: z.string().nullable(),
  role: z.string(),
});

export const SignInResponseSchema = z.object({
  token: z.string(),
  token_type: z.literal("Bearer"),
  expires_in: z.number(),
  user: UserResponseSchema,
});

// Schema for database row (organizer login)
export const OrganizerLoginRowSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  email: z.string().nullable(),
  role: z.string(),
});

// Schema for creating organizer user
export const CreateOrganizerUserInputSchema = z.object({
  username: z.string(),
  password: z.string(),
  email: z.string().nullable(),
  role: z.enum(["admin", "organizer"]),
});

// Type exports (inferred from Zod schemas)
export type SignInBody = z.infer<typeof SignInSchema>;
export type RegisterBody = z.infer<typeof RegisterSchema>;
export type SignInResponse = z.infer<typeof SignInResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type OrganizerLoginRow = z.infer<typeof OrganizerLoginRowSchema>;
export type CreateOrganizerUserInput = z.infer<typeof CreateOrganizerUserInputSchema>;
