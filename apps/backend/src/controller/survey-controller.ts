import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  QuestionWithSetSchema,
  QuestionSetWithQuestionsSchema,
  QuestionSchema,
  QUESTION_SET_TYPES
} from "../models/survey.model.js";
import {
  getQuestionsByExhibitionId,
  getMasterQuestions,
  createQuestionSetForExhibition
} from "../queries/survey-query.js";
import { requireOrganizerAuth } from "../services/auth-middleware.js";

export default async function surveyController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

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
        summary: "Get master questions by type",
        description: "Returns master questions (template) for EXHIBITION or UNIT type",
        querystring: z.object({
          type: z.enum(QUESTION_SET_TYPES),
        }),
        response: {
          200: z.array(QuestionSchema),
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
        description: "Creates a question set with custom questions and links it to the specified exhibition",
        body: z.object({
          exhibition_id: z.number().int().positive(),
          type: z.enum(QUESTION_SET_TYPES),
          questions: z.array(z.object({
            topic: z.string().min(1, "Question topic is required"),
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
        questions: { topic: string }[];
      };

      // Extract just the topics
      const questionTopics = questions.map(q => q.topic);

      const questionSet = await createQuestionSetForExhibition(
        exhibition_id,
        type,
        questionTopics
      );

      reply.code(201);
      return questionSet;
    }
  );
}