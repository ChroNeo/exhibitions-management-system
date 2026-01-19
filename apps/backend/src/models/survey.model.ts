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

// Zod Schema for Survey Submission Request
export const DoSurveyBodySchema = z.object({
  exhibition_id: z.number().int().positive(),
  unit_id: z.number().int().positive().optional(), // null/undefined = exhibition survey
  comment: z.string().max(1000).optional(),
  answers: z.array(z.object({
    question_id: z.number().int().positive(),
    score: z.number().int().min(1).max(5),
  })).min(1, "At least one answer is required"),
});

// Zod Schema for Survey Submission Response
export const SurveySubmissionResponseSchema = z.object({
  submission_id: z.number(),
  exhibition_id: z.number(),
  unit_id: z.number().nullable(),
  user_id: z.number(),
  comment: z.string().nullable(),
  created_at: z.string(),
  answers: z.array(z.object({
    answer_id: z.number(),
    question_id: z.number(),
    score: z.number(),
  })),
});

// Inferred types from Zod schemas
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionSet = z.infer<typeof QuestionSetSchema>;
export type QuestionWithSet = z.infer<typeof QuestionWithSetSchema>;
export type QuestionSetWithQuestions = z.infer<typeof QuestionSetWithQuestionsSchema>;
export type DoSurveyBody = z.infer<typeof DoSurveyBodySchema>;
export type SurveySubmissionResponse = z.infer<typeof SurveySubmissionResponseSchema>;
