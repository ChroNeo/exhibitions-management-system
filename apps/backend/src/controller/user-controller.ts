import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { getListUsers } from "../queries/users-query.js";
import { UserDropdownOptionSchema } from "../models/user.model.js";

export default async function userController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "List users for dropdown selections",
        response: {
          200: z.array(UserDropdownOptionSchema),
        },
      },
    },
    async () => {
      const users = await getListUsers();
      return users.map((user) => ({
        value: user.user_id,
        label: user.full_name || `User ${user.user_id}`,
      }));
    }
  );
}
