import type { FastifyInstance, FastifyRequest } from "fastify";
import { getListUsers, type UserRoleFilter } from "../queries/users-query.js";

type ListUsersQuery = {
  role?: UserRoleFilter;
};

export default async function userController(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "List users for dropdown selections",
        querystring: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["staff", "user"],
              description: "Filter by user role",
            },
          },
        },
        response: {
          200: {
            type: "array",
            items: { $ref: "UserDropdownOption#" },
            example: [
              {
                value: 1,
                label: "Alice Example",
              },
            ],
          },
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: ListUsersQuery }>) => {
      const users = await getListUsers(req.query.role);
      return users.map((user) => ({
        value: user.user_id,
        label: user.full_name,
      }));
    }
  );
}
