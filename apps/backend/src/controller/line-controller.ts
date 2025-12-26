import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { AppError } from "../errors.js";
import { getLineConfig } from "../services/line/config.js";
import { verifyLineSignature } from "../services/line/security.js";
import { dispatchLineEvent } from "../services/line/dispatcher.js";
import {
  LineWebhookPayloadSchema,
  LineWebhookResponseSchema,
  type LineWebhookPayload,
} from "../models/line.model.js";

type RawBodyRequest = FastifyRequest & {
  rawBody?: string | Buffer;
};

export default async function lineController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    "/webhook",
    {
      config: {
        rawBody: true,
      },
      schema: {
        tags: ["LINE"],
        summary: "LINE webhook endpoint",
        description: "Receives events from LINE Messaging API",
        body: LineWebhookPayloadSchema,
        response: {
          200: LineWebhookResponseSchema,
        },
        hide: true,
      },
    },
    async (req: RawBodyRequest, reply: FastifyReply) => {
      const signatureHeader = req.headers["x-line-signature"];
      if (typeof signatureHeader !== "string") {
        reply.code(400).send({ message: "missing LINE signature header" });
        return;
      }

      if (!req.rawBody) {
        throw new AppError(
          "rawBody is not available for LINE webhook",
          500,
          "CONFIG_ERROR"
        );
      }

      const config = getLineConfig();
      const isValidSignature = verifyLineSignature(signatureHeader, req.rawBody, config);
      if (!isValidSignature) {
        reply.code(401).send({ message: "invalid LINE signature" });
        return;
      }

      const payload = req.body as LineWebhookPayload;
      const events = payload?.events ?? [];
      if (!events.length) {
        reply.send({ ok: true });
        return;
      }

      await Promise.all(
        events.map((event) =>
          dispatchLineEvent(event, config, app.log).catch((err) => {
            app.log.error({ err, event }, "failed to process LINE event");
          })
        )
      );

      reply.send({ ok: true });
    }
  );
}
