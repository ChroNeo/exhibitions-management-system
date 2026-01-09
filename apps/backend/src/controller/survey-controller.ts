import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  QuestionWithSetSchema,
  QuestionSetWithQuestionsSchema,
  QUESTION_SET_TYPES,
  DoSurveyBodySchema,
  type DoSurveyBody
} from "../models/survey.model.js";
import {
  getQuestionsByExhibitionId,
  getMasterQuestions,
  createQuestionSetForExhibition,
  updateQuestionSet,
  submitSurvey
} from "../queries/survey-query.js";
import { requireOrganizerAuth } from "../services/auth-middleware.js";
import { AuthHeaderSchema } from "../models/ticket.model.js";
import { verifyLiffIdToken } from "../services/line/security.js";
import { getUserRegistrationsByLineId } from "../queries/ticket-query.js";
import { AppError } from "../errors.js";

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

  app.put(
    "/questions",
    {
      preHandler: requireOrganizerAuth,
      schema: {
        tags: ["Survey"],
        summary: "Update question set for exhibition",
        description: "Updates an existing question set by replacing all questions with new ones",
        body: z.object({
          exhibition_id: z.number().int().positive(),
          type: z.enum(QUESTION_SET_TYPES),
          questions: z.array(z.object({
            topic: z.string().min(1, "Question topic is required"),
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
        questions: { topic: string }[];
      };

      // Extract just the topics
      const questionTopics = questions.map(q => q.topic);

      const questionSet = await updateQuestionSet(
        exhibition_id,
        type,
        questionTopics
      );

      reply.code(200);
      return questionSet;
    }
  );

  app.post(
    "/submit",
    {
      schema: {
        tags: ["Survey"],
        summary: "Submit survey responses for exhibition or unit",
        description: "Submit survey answers using LINE LIFF authentication. Validates user registration and prevents duplicate submissions.",
        headers: AuthHeaderSchema,
        body: DoSurveyBodySchema,
      },
    },
    async (req: FastifyRequest<{ Body: DoSurveyBody }>, reply: FastifyReply) => {
      try {
        // Step 1: Get and verify LINE LIFF ID token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          throw new AppError("Missing Auth", 401, "MISSING_AUTH");
        }

        const token = authHeader.split(" ")[1];
        req.log.info("Verifying LIFF token...");
        const verifiedToken = await verifyLiffIdToken(token);
        req.log.info({ sub: verifiedToken.sub }, "Token verified");

        // Step 2: Get user_id from LINE user ID
        const userData = await getUserRegistrationsByLineId(verifiedToken.sub);
        req.log.info({ userData }, "User data retrieved");
        if (!userData) {
          throw new AppError("User not found", 404, "USER_NOT_FOUND");
        }

        // Step 3: Submit the survey
        const { exhibition_id, unit_id, comment, answers } = req.body;
        req.log.info({ exhibition_id, unit_id, answerCount: answers.length }, "Submitting survey");
        const result = await submitSurvey(
          userData.user_id,
          exhibition_id,
          unit_id,
          comment,
          answers
        );
        req.log.info({ submissionId: result.submission_id }, "Survey submitted successfully");

        return reply.code(201).send(result);
      } catch (error) {
        if (error instanceof AppError) {
          req.log.warn({ error: error.message, code: error.code, status: error.status }, "Application error in survey submission");
          return reply.code(error.status).send({
            message: error.message,
            code: error.code,
          });
        }

        // Log full error details
        req.log.error({
          error: error instanceof Error ? error.stack : String(error),
          errorMessage: error instanceof Error ? error.message : String(error),
          body: req.body,
          headers: req.headers.authorization ? 'present' : 'missing',
        }, "Unexpected error in survey submission");

        // Return more detailed error in development
        const isDev = process.env.NODE_ENV !== 'production';
        return reply.code(500).send({
          message: "internal server error",
          ...(isDev && {
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          })
        });
      }
    }
  );
}