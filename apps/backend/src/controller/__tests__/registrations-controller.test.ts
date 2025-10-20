import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../errors.js";
import registrationsController from "../registrations-controller.js";
import { registerSchemas } from "../../services/schema.js";
import { registerForExhibition } from "../../queries/registrations-query.js";

vi.mock("../../queries/registrations-query.js", () => ({
  registerForExhibition: vi.fn(),
}));

const registerForExhibitionMock = vi.mocked(registerForExhibition);

const buildApp = async () => {
  const app = Fastify({
    ajv: {
      customOptions: {
        strictSchema: false,
      },
    },
  });
  registerSchemas(app);
  await registrationsController(app);
  return app;
};

describe("registrationsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a visitor and returns the persisted record", async () => {
    const app = await buildApp();
    const payload = {
      exhibition_id: 1,
      full_name: "  สมชาย ใจดี ",
      email: "user@example.com",
      role: "visitor",
      phone: " 0812345678 ",
    };
    const result = {
      user: { user_id: 123, role: "user" as const },
      registration: { registration_id: 456, exhibition_id: 1 },
    };
    registerForExhibitionMock.mockResolvedValue(result);

    try {
      const response = await app.inject({
        method: "POST",
        url: "/",
        payload,
      });

      expect(response.statusCode).toBe(201);
      expect(registerForExhibitionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exhibition_id: 1,
          full_name: "สมชาย ใจดี",
          email: "user@example.com",
          role: "visitor",
          phone: "0812345678",
        })
      );
      expect(response.json()).toEqual(result);
    } finally {
      await app.close();
    }
  });

  it("rejects staff registration without unit_code", async () => {
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: "POST",
        url: "/",
        payload: {
          exhibition_id: 2,
          full_name: "Staff Member",
          email: "staff@example.com",
          role: "staff",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(registerForExhibitionMock).not.toHaveBeenCalled();
      expect(response.json()).toMatchObject({
        message: "unit_code required for staff",
        code: "VALIDATION_ERROR",
      });
    } finally {
      await app.close();
    }
  });

  it("maps AppError from service into HTTP response", async () => {
    const app = await buildApp();
    registerForExhibitionMock.mockRejectedValue(
      new AppError("unit_code not found in this exhibition", 400, "UNIT_NOT_FOUND")
    );

    try {
      const response = await app.inject({
        method: "POST",
        url: "/",
        payload: {
          exhibition_id: 3,
          full_name: "Staff Member",
          email: "staff@example.com",
          role: "staff",
          unit_code: "ABC123",
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        message: "unit_code not found in this exhibition",
        code: "UNIT_NOT_FOUND",
      });
    } finally {
      await app.close();
    }
  });
});
