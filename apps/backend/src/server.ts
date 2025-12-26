import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import swagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import fastifyRawBody from "fastify-raw-body";
import { z } from "zod";
// --- Import Controllers ---
import exhibitionsController from "./controller/exhibitions-controller.js";
import unitsController from "./controller/units-controller.js";
import authController from "./controller/auth-controller.js";
import userController from "./controller/user-controller.js";
import heroController from "./controller/hero-controller.js";
import registrationsController from "./controller/registrations-controller.js";
import lineController from "./controller/line-controller.js";
import ticketController from "./controller/ticket-controller.js";

// --- Import Services ---
import { safeQuery } from "./services/dbconn.js";
import { registerSchemas } from "./services/schema.js";

// --- Import Zod Provider ---
// 1. เพิ่ม import ตรงนี้
import {
  validatorCompiler,
  serializerCompiler,
  ZodTypeProvider,
  jsonSchemaTransform // ตัวช่วยแปลง Zod เป็น Swagger
} from 'fastify-type-provider-zod';

dotenv.config();

// สร้าง instance หลัก
const fastify = Fastify();

// 2. Setup Compiler ให้รองรับ Zod
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// 3. แปลงร่าง instance ให้เป็น Type Provider
const app = fastify.withTypeProvider<ZodTypeProvider>();

// registerSchemas(app); // อันนี้ของเก่า (Json Schema) ยังใช้ร่วมกันได้

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
  prefix: "/uploads/",
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
      { name: "Exhibitions", description: "Manage exhibitions lifecycle and metadata." },
      { name: "Units", description: "Manage exhibition units and activities." },
      { name: "Users", description: "Manage system users and assignments." },
      { name: "Registrations", description: "Register visitors and staff to exhibitions." },
      { name: "Tickets", description: "Manage exhibition tickets and redemption." },
    ],
  },
  // 4. สำคัญมาก! ต้องใส่บรรทัดนี้เพื่อให้ Swagger อ่าน Zod Schema ออก
  transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list", // แนะนำให้เปลี่ยนเป็น 'list' ถ้า API เยอะ จะได้ไม่รก
    deepLinking: false,
  },
});

// --- Routes ---

// Health Check (ตัวอย่างการเขียนแบบ Zod ผสมของเดิม)
app.get(
  "/health",
  {
    schema: {
      tags: ["System"],
      summary: "Health check",
      response: {
        200: z.object({
          ok: z.boolean().describe("Health status"), // .describe() จะไปโผล่ใน Swagger description ด้วย
        }),
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
        200: z.object({
          db: z.string(),
          result: z.object({
            ping: z.number(),
          }),
        }),
      },
    },
  },
  async () => {
    const rows = await safeQuery<{ ping: number }[]>("SELECT 1 AS ping");
    return { db: "ok", result: rows[0] };
  }
);

// Register Controllers
app.register(exhibitionsController, { prefix: "/api/v1/exhibitions" });
app.register(unitsController, { prefix: "/api/v1/exhibitions" });
app.register(authController, { prefix: "/api/v1/auth" });
// app.register(userController, { prefix: "/api/v1/users" });
// app.register(heroController, { prefix: "/api/v1/feature" });
// app.register(registrationsController, { prefix: "/api/v1/registrations" });
// app.register(lineController, { prefix: "/line" });
// app.register(ticketController, { prefix: "/api/v1/ticket" });

// Start Server
const port = Number(process.env.PORT || 3001);

// หมายเหตุ: ลบ app.listen(3000) อันก่อนหน้าออกเพราะซ้ำซ้อนกับด้านล่าง
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
});