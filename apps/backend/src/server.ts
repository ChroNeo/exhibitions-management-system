import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import exhibitionsController from "./controller/exhibitions-controller.js";
import { safeQuery } from "./services/dbconn.js";
import { registerSchemas } from "./services/schema.js";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import unitsController from "./controller/units-controller.js";
import authController from "./controller/auth-controller.js";
import userController from "./controller/user-controller.js";
import heroController from "./controller/hero-controller.js";
import registrationsController from "./controller/registrations-controller.js";
import fastifyRawBody from "fastify-raw-body";
import lineController from "./controller/line-controller.js";
dotenv.config();

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      strictSchema: false,
    },
  },
});

registerSchemas(app);
await app.register(fastifyRawBody, {
  field: "rawBody",
  global: false,
  encoding: "utf8",
  runFirst: true,
});

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
});
await app.register(multipart, {
  limits: {
    fields: 20,
    fileSize: 20 * 1024 * 1024,
    files: 5,
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
    tags: [
      { name: "System", description: "Utility endpoints such as health checks." },
      {
        name: "Exhibitions",
        description: "Manage exhibitions lifecycle and metadata.",
      },
      { name: "Units", description: "Manage exhibition units and activities." },
      { name: "Users", description: "Manage system users and assignments." },
      {
        name: "Registrations",
        description: "Register visitors and staff to exhibitions.",
      },
    ],
  },
});
await app.register(swaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
});

app.get(
  "/health",
  {
    schema: {
      tags: ["System"],
      summary: "Health check",
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: true },
          },
          required: ["ok"],
        },
      },
    },
  },
  async () => ({ ok: true })
);

app.get(
  "/db/ping",
  {
    schema: {
      tags: ["System"],
      summary: "Database connectivity check",
      response: {
        200: {
          type: "object",
          properties: {
            db: { type: "string", example: "ok" },
            result: {
              type: "object",
              properties: {
                ping: { type: "integer", example: 1 },
              },
              required: ["ping"],
            },
          },
          required: ["db", "result"],
        },
      },
    },
  },
  async () => {
    const rows = await safeQuery<{ ping: number }[]>("SELECT 1 AS ping");
    return { db: "ok", result: rows[0] };
  }
);

app.register(exhibitionsController, { prefix: "/api/v1/exhibitions" });
app.register(unitsController, { prefix: "/api/v1/exhibitions" });
app.register(authController, { prefix: "/api/v1/auth" });
app.register(userController, { prefix: "/api/v1/users" });
app.register(heroController, { prefix: "/api/v1/feature" });
app.register(registrationsController, { prefix: "/api/v1/registrations" });
app.register(lineController, { prefix: "/line" });

app.listen({ port: 3000, host: "0.0.0.0" });

const port = Number(process.env.PORT || 3001);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
});


