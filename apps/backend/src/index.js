import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import exhibitionsController from "../controller/exhibitions-controller.js";
dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
app.get("/health", async () => ({ ok: true }));

app.get("/db/ping", async () => {
  const [rows] = await pool.query("SELECT 1 AS ping");
  return { db: "ok", result: rows[0] };
});
app.register(exhibitionsController, { prefix: "/api/v1/" });

const port = Number(process.env.PORT || 3001);
app.listen({ port }).then(() => {
  console.log(`API running on http://localhost:${port}`);
});
