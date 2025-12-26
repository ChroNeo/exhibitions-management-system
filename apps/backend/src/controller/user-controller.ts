import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { getListUsers } from "../queries/users-query.js";
import {
  UserDropdownOptionSchema,
  ListUsersQuerySchema,
  type ListUsersQuery,
} from "../models/user.model.js";

export default async function userController(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "List users for dropdown selections",
        querystring: ListUsersQuerySchema,
        response: {
          200: z.array(UserDropdownOptionSchema),
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: ListUsersQuery }>) => {
      const users = await getListUsers(req.query.role);
      return users.map((user) => ({
        value: user.user_id,
        label: user.full_name || `User ${user.user_id}`,
      }));
    }
  );
}
