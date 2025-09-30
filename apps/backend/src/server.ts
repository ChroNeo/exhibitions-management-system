import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import exhibitionsController from "./controller/exhibitions-controller.js";
import { safeQuery } from "./services/dbconn.js";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import unitsController from "./controller/units-controller.js";
dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
await app.register(multipart, {
  limits: {
    fields: 20,
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});
app.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/uploads/", // URL base
  decorateReply: false,
});
// Register Swagger
await app.register(swagger, {
  openapi: {
    info: {
      title: "Exhibition API",
      description: "API documentation for Exhibition",
      version: "1.0.0",
    },
  },
});
await app.register(swaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
});

app.get("/health", async () => ({ ok: true }));

app.get("/db/ping", async () => {
  const rows = await safeQuery<{ ping: number }[]>("SELECT 1 AS ping");
  return { db: "ok", result: rows[0] };
});
app.register(exhibitionsController, { prefix: "/api/v1/exhibitions" });
app.register(unitsController, { prefix: "/api/v1/exhibitions" });
const port = Number(process.env.PORT || 3001);
app.listen({ port }).then(() => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
});
