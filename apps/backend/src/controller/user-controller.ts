import type { FastifyInstance } from "fastify";
import { getListUsers } from "../queries/users-query.js";

export default async function userController(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Users"],
        summary: "List users for dropdown selections",
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
    async () => {
      const users = await getListUsers();
      return users.map((user) => ({
        value: user.user_id,
        label: user.full_name,
      }));
    }
  );
}
