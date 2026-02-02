import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  QuestionWithSetSchema,
  QuestionSetWithQuestionsSchema,
  QuestionsTemplateSchema,
  QUESTION_SET_TYPES,
  DoSurveyBodySchema,
  type DoSurveyBody
} from "../models/survey.model.js";
import {
  getQuestionsByExhibitionId,
  getMasterQuestions,
  createQuestionSetForExhibition,
  updateQuestionSet,
  submitSurvey,
  checkSurveyCompleted,
  getQuestionsTemplate,
  createQuestionsTemplate,
  updateQuestionTemplate,
  deleteQuestionTemplate
} from "../queries/survey-query.js";
import { safeQuery } from "../services/dbconn.js";
import { requireOrganizerAuth, requireLiffAuth } from "../services/auth-middleware.js";
import { AuthHeaderSchema } from "../models/ticket.model.js";
import { AppError } from "../errors.js";

export default async function surveyController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // ─── Questions Template CRUD ─────────────────────────────────────────────

  app.get(
    "/questions-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Survey"],
        summary: "Get all questions from template bank",
        querystring: z.object({
          category: z.string().optional(),
        }),
        response: {
          200: z.array(QuestionsTemplateSchema),
        },
      },
    },
    async (req, reply) => {
      const { category } = req.query as { category?: string };
      return await getQuestionsTemplate(category);
    }
  );

  app.post(
    "/questions-template",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Survey"],
        summary: "Create new question(s) in the template bank",
        body: z.object({
          questions: z.array(z.object({
            content: z.string().min(1, "Question content is required"),
            category: z.string().nullable().optional(),
          })).min(1, "At least one question is required"),
        }),
        response: {
          201: z.array(QuestionsTemplateSchema),
        },
      },
    },
    async (req, reply) => {
      const { questions } = req.body as { questions: Array<{ content: string; category?: string | null }> };
      const result = await createQuestionsTemplate(questions);
      reply.code(201);
      return result;
    }
  );

  app.put(
    "/questions-template/:id",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Survey"],
        summary: "Update a question template",
        params: z.object({
          id: z.string().regex(/^\d+$/),
        }),
        body: z.object({
          content: z.string().min(1, "Question content is required"),
          category: z.string().nullable().optional(),
        }),
        response: {
          200: QuestionsTemplateSchema,
        },
      },
    },
    async (req) => {
      const qtId = Number((req.params as any).id);
      const { content, category } = req.body as { content: string; category?: string | null };
      return await updateQuestionTemplate(qtId, content, category);
    }
  );

  app.delete(
    "/questions-template/:id",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Survey"],
        summary: "Delete a question template",
        params: z.object({
          id: z.string().regex(/^\d+$/),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (req, reply) => {
      const qtId = Number((req.params as any).id);
      await deleteQuestionTemplate(qtId);
      reply.code(204).send();
    }
  );

  // ─── Question Sets ───────────────────────────────────────────────────────

  app.get(
    "/questions",
    {
      schema: {
        tags: ["Survey"],
        summary: "Get questions by exhibition ID",
        querystring: z.object({
          exhibition_id: z.string().regex(/^\d+$/, "exhibition_id must be a number"),
          type: z.enum(["EXHIBITION", "UNIT"]).optional(),
        }),
        response: {
          200: z.array(QuestionWithSetSchema),
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: { exhibition_id: string; type?: "EXHIBITION" | "UNIT" } }>) => {
      const { exhibition_id, type } = req.query;
      return await getQuestionsByExhibitionId(exhibition_id, type);
    }
  );

  app.get(
    "/master-questions",
    {
      schema: {
        tags: ["Survey"],
        summary: "Get master question sets by type",
        description: "Returns all master question sets with their questions for EXHIBITION or UNIT type",
        querystring: z.object({
          type: z.enum(QUESTION_SET_TYPES),
        }),
        response: {
          200: z.array(QuestionSetWithQuestionsSchema),
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: { type: "EXHIBITION" | "UNIT" } }>) => {
      const { type } = req.query;
      return await getMasterQuestions(type);
    }
  );

  app.post(
    "/questions",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Survey"],
        summary: "Create question set for exhibition",
        description: "Creates a question set by mapping qt_ids from the template bank to the exhibition",
        body: z.object({
          exhibition_id: z.number().int().positive(),
          type: z.enum(QUESTION_SET_TYPES),
          questions: z.array(z.object({
            qt_id: z.number().int().positive(),
            sort_order: z.number().int().min(0).default(0),
          })).min(1, "At least one question is required"),
        }),
        response: {
          201: QuestionSetWithQuestionsSchema,
        },
      },
    },
    async (req, reply) => {
      const { exhibition_id, type, questions } = req.body as {
        exhibition_id: number;
        type: "EXHIBITION" | "UNIT";
        questions: Array<{ qt_id: number; sort_order: number }>;
      };

      const questionSet = await createQuestionSetForExhibition(
        exhibition_id,
        type,
        questions
      );

      reply.code(201);
      return questionSet;
    }
  );

  app.put(
    "/questions",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Survey"],
        summary: "Update question set for exhibition",
        description: "Updates an existing question set by replacing all mappings with new qt_ids",
        body: z.object({
          exhibition_id: z.number().int().positive(),
          type: z.enum(QUESTION_SET_TYPES),
          questions: z.array(z.object({
            qt_id: z.number().int().positive(),
            sort_order: z.number().int().min(0).default(0),
          })).min(1, "At least one question is required"),
        }),
        response: {
          200: QuestionSetWithQuestionsSchema,
        },
      },
    },
    async (req, reply) => {
      const { exhibition_id, type, questions } = req.body as {
        exhibition_id: number;
        type: "EXHIBITION" | "UNIT";
        questions: Array<{ qt_id: number; sort_order: number }>;
      };

      const questionSet = await updateQuestionSet(
        exhibition_id,
        type,
        questions
      );

      reply.code(200);
      return questionSet;
    }
  );

  // ─── Survey Submission ───────────────────────────────────────────────────

  app.get(
    "/check-completed",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Survey"],
        summary: "Check if user has completed a survey",
        description: "Check if user has already submitted survey for an exhibition or unit",
        querystring: z.object({
          exhibition_id: z.string().regex(/^\d+$/, "exhibition_id must be a number"),
          unit_id: z.string().regex(/^\d+$/, "unit_id must be a number").optional(),
        }),
        response: {
          200: z.object({
            is_completed: z.boolean(),
          }),
        },
      },
    },
    async (req, reply) => {
      const exhibitionId = Number(req.query.exhibition_id);
      const unitId = req.query.unit_id ? Number(req.query.unit_id) : undefined;

      const isCompleted = await checkSurveyCompleted(req.lineUser!.user_id, exhibitionId, unitId);

      return { is_completed: isCompleted };
    }
  );

  app.post(
    "/submit",
    {
      preHandler: requireLiffAuth,
      schema: {
        tags: ["Survey"],
        summary: "Submit survey responses for exhibition or unit",
        description: "Submit survey answers using LINE LIFF authentication. Validates user registration and prevents duplicate submissions.",
        body: DoSurveyBodySchema,
      },
    },
    async (req, reply) => {
      const { exhibition_id, unit_id, comment, answers } = req.body;
      req.log.info({ exhibition_id, unit_id, answerCount: answers.length }, "Submitting survey");

      const result = await submitSurvey(
        req.lineUser!.user_id,
        exhibition_id,
        unit_id,
        comment,
        answers
      );

      req.log.info({ submissionId: result.submission_id }, "Survey submitted successfully");

      return reply.code(201).send(result);
    }
  );
}
