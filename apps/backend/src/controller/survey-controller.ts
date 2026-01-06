import { FastifyInstance, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { QuestionWithSetSchema } from "../models/survey.model.js";
import { getQuestionsByExhibitionId } from "../queries/survey-query.js";

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
}