import { z } from "zod";

// Question Set Types
export const QUESTION_SET_TYPES = ["EXHIBITION", "UNIT"] as const;
export type QuestionSetType = (typeof QUESTION_SET_TYPES)[number];

// Zod Schema for Question
export const QuestionSchema = z.object({
  question_id: z.number(),
  set_id: z.number(),
  topic: z.string(),
});

// Zod Schema for Question Set
export const QuestionSetSchema = z.object({
  set_id: z.number(),
  name: z.string(),
  is_master: z.number(), // 0 or 1 (boolean in DB)
  type: z.enum(QUESTION_SET_TYPES),
});

// Zod Schema for Questions with Set Info
export const QuestionWithSetSchema = QuestionSchema.extend({
  set_name: z.string(),
  set_type: z.enum(QUESTION_SET_TYPES),
  is_master: z.number(),
});

// Zod Schema for Question Set with Questions
export const QuestionSetWithQuestionsSchema = QuestionSetSchema.extend({
  questions: z.array(QuestionSchema),
});

// Inferred types from Zod schemas
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionSet = z.infer<typeof QuestionSetSchema>;
export type QuestionWithSet = z.infer<typeof QuestionWithSetSchema>;
export type QuestionSetWithQuestions = z.infer<typeof QuestionSetWithQuestionsSchema>;
