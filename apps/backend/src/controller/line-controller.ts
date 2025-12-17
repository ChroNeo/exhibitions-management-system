import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { AppError } from "../errors.js";
import {
  getLineConfig,
  verifyLineSignature,
} from "../services/line.js";
import { dispatchLineEvent, type LineEvent } from "../services/line/dispatcher.js";

type RawBodyRequest = FastifyRequest & {
  rawBody?: string | Buffer;
};

type LineWebhookPayload = {
  events?: LineEvent[];
};

export default async function lineController(app: FastifyInstance) {
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
