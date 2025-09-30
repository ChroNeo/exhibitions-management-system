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

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      strictSchema: false,
    },
  },
});

app.addSchema({
  $id: "Exhibition",
  type: "object",
  properties: {
    exhibition_id: { type: "integer", example: 42 },
    exhibition_code: { type: "string", example: "EXH-042" },
    title: { type: "string", example: "Tech Innovation Expo" },
    description: { type: ["string", "null"], example: "Annual technology showcase." },
    start_date: { type: "string", format: "date-time", example: "2024-05-01T09:00:00Z" },
    end_date: { type: "string", format: "date-time", example: "2024-05-05T17:00:00Z" },
    location: { type: ["string", "null"], example: "Hall A, Bangkok Convention Centre" },
    organizer_name: { type: "string", example: "Innovate Co." },
    picture_path: { type: ["string", "null"], example: "uploads/exhibitions/exh-042.jpg" },
    status: { type: ["string", "null"], example: "published" },
    created_by: { type: ["integer", "null"], example: 7 },
  },
  required: ["exhibition_id", "title", "start_date", "end_date", "organizer_name"],
  examples: [
    {
      exhibition_id: 42,
      exhibition_code: "EXH-042",
      title: "Tech Innovation Expo",
      description: "Annual technology showcase.",
      start_date: "2024-05-01T09:00:00Z",
      end_date: "2024-05-05T17:00:00Z",
      location: "Hall A, Bangkok Convention Centre",
      organizer_name: "Innovate Co.",
      picture_path: "uploads/exhibitions/exh-042.jpg",
      status: "published",
      created_by: 7,
    },
  ],
});

app.addSchema({
  $id: "Unit",
  type: "object",
  properties: {
    unit_id: { type: "integer", example: 105 },
    exhibition_id: { type: "integer", example: 42 },
    unit_code: { type: "string", example: "U-05" },
    unit_name: { type: "string", example: "AI Playground" },
    unit_type: { type: "string", enum: ["booth", "activity"], example: "booth" },
    description: { type: ["string", "null"], example: "Interactive demos of AI gadgets." },
    staff_user_id: { type: ["integer", "null"], example: 13 },
    poster_url: { type: ["string", "null"], example: "uploads/units/ai-playground.png" },
    starts_at: { type: ["string", "null"], format: "date-time", example: "2024-05-01T10:00:00Z" },
    ends_at: { type: ["string", "null"], format: "date-time", example: "2024-05-01T18:00:00Z" },
  },
  required: ["unit_id", "exhibition_id", "unit_name", "unit_type"],
  examples: [
    {
      unit_id: 105,
      exhibition_id: 42,
      unit_code: "U-05",
      unit_name: "AI Playground",
      unit_type: "booth",
      description: "Interactive demos of AI gadgets.",
      staff_user_id: 13,
      poster_url: "uploads/units/ai-playground.png",
      starts_at: "2024-05-01T10:00:00Z",
      ends_at: "2024-05-01T18:00:00Z",
    },
  ],
});

app.addSchema({
  $id: "CreateExhibitionInput",
  type: "object",
  required: ["title", "start_date", "end_date", "organizer_name", "created_by"],
  properties: {
    title: { type: "string", example: "Tech Innovation Expo" },
    description: { type: ["string", "null"], example: "Annual technology showcase." },
    start_date: { type: "string", format: "date-time", example: "2024-05-01T09:00:00Z" },
    end_date: { type: "string", format: "date-time", example: "2024-05-05T17:00:00Z" },
    location: { type: ["string", "null"], example: "Hall A, Bangkok Convention Centre" },
    organizer_name: { type: "string", example: "Innovate Co." },
    picture_path: { type: ["string", "null"], example: "uploads/exhibitions/exh-042.jpg" },
    status: {
      type: "string",
      enum: ["draft", "published", "ongoing", "ended", "archived"],
      example: "published",
    },
    created_by: { type: "integer", example: 7 },
  },
  examples: [
    {
      title: "Tech Innovation Expo",
      description: "Annual technology showcase.",
      start_date: "2024-05-01T09:00:00Z",
      end_date: "2024-05-05T17:00:00Z",
      location: "Hall A, Bangkok Convention Centre",
      organizer_name: "Innovate Co.",
      picture_path: "uploads/exhibitions/exh-042.jpg",
      status: "published",
      created_by: 7,
    },
  ],
});

app.addSchema({
  $id: "UpdateExhibitionInput",
  type: "object",
  properties: {
    title: { type: "string", example: "Tech Innovation Expo - Day 2" },
    description: { type: ["string", "null"], example: "Updated description" },
    start_date: { type: "string", format: "date-time", example: "2024-05-02T09:00:00Z" },
    end_date: { type: "string", format: "date-time", example: "2024-05-06T17:00:00Z" },
    location: { type: ["string", "null"], example: "Hall B" },
    organizer_name: { type: "string", example: "Innovate Co." },
    picture_path: { type: ["string", "null"], example: "uploads/exhibitions/exh-042-updated.jpg" },
    status: {
      type: "string",
      enum: ["draft", "published", "ongoing", "ended", "archived"],
    },
  },
  additionalProperties: false,
  examples: [
    {
      title: "Tech Innovation Expo - Day 2",
      description: "Updated description",
      start_date: "2024-05-02T09:00:00Z",
      end_date: "2024-05-06T17:00:00Z",
      location: "Hall B",
      organizer_name: "Innovate Co.",
      picture_path: "uploads/exhibitions/exh-042-updated.jpg",
      status: "ongoing",
    },
  ],
});

app.addSchema({
  $id: "CreateUnitInput",
  type: "object",
  required: ["unit_name", "unit_type"],
  properties: {
    unit_name: { type: "string", example: "AI Playground" },
    unit_type: { type: "string", enum: ["booth", "activity"], example: "booth" },
    description: { type: ["string", "null"], example: "Hands-on AI demo area." },
    staff_user_id: { type: ["integer", "null"], example: 13 },
    poster_url: { type: ["string", "null"], example: "uploads/units/ai-playground.png" },
    starts_at: { type: ["string", "null"], format: "date-time", example: "2024-05-01T10:00:00Z" },
    ends_at: { type: ["string", "null"], format: "date-time", example: "2024-05-01T18:00:00Z" },
  },
  additionalProperties: false,
  examples: [
    {
      unit_name: "AI Playground",
      unit_type: "booth",
      description: "Hands-on AI demo area.",
      staff_user_id: 13,
      poster_url: "uploads/units/ai-playground.png",
      starts_at: "2024-05-01T10:00:00Z",
      ends_at: "2024-05-01T18:00:00Z",
    },
  ],
});

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
    tags: [
      { name: "System", description: "Utility endpoints such as health checks." },
      {
        name: "Exhibitions",
        description: "Manage exhibitions lifecycle and metadata.",
      },
      { name: "Units", description: "Manage exhibition units and activities." },
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
const port = Number(process.env.PORT || 3001);
app.listen({ port }).then(() => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
});
