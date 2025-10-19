import Fastify from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import authController from "../auth-controller.js";
import {
  authenticateOrganizerUser,
  createOrganizerUser,
} from "../../queries/auth-query.js";
import { signJwt } from "../../services/jwt.js";

vi.mock("../../queries/auth-query.js", () => ({
  authenticateOrganizerUser: vi.fn(),
  createOrganizerUser: vi.fn(),
}));

vi.mock("../../services/jwt.js", () => ({
  signJwt: vi.fn(),
}));

const authenticateOrganizerUserMock = vi.mocked(authenticateOrganizerUser);
const createOrganizerUserMock = vi.mocked(createOrganizerUser);
const signJwtMock = vi.mocked(signJwt);

const buildApp = async () => {
  const app = Fastify({
    ajv: {
      customOptions: {
        strictSchema: false,
      },
    },
  });
  await authController(app);
  return app;
};

describe("authController", () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1800";
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_EXPIRES_IN = originalExpiresIn;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ทดสอบว่า POST /signin ตรวจสอบข้อมูลแล้วคืน token พร้อมข้อมูลผู้ใช้
  it("signs in an organizer user and issues a JWT", async () => {
    const app = await buildApp();
    const userRecord = {
      user_id: 11,
      username: "organizer01",
      email: "user@example.com",
      role: "admin",
    };
    authenticateOrganizerUserMock.mockResolvedValue(userRecord);
    signJwtMock.mockReturnValue("signed.jwt.token");

    try {
      const response = await app.inject({
        method: "POST",
        url: "/signin",
        payload: {
          username: "organizer01",
          password: "secret",
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(authenticateOrganizerUserMock).toHaveBeenCalledWith("organizer01", "secret");
      expect(signJwtMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: String(userRecord.user_id),
          role: userRecord.role,
        }),
        "test-secret"
      );
      expect(response.json()).toEqual({
        token: "signed.jwt.token",
        token_type: "Bearer",
        expires_in: 1800,
        user: userRecord,
      });
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า POST /register ส่งข้อมูลไป createOrganizerUser และคืนรหัสผู้ใช้ที่สร้างใหม่
  it("registers a new organizer user", async () => {
    const app = await buildApp();
    const createdUser = {
      user_id: 77,
      username: "neworganizer",
      email: "new@org.com",
      role: "organizer",
    };
    createOrganizerUserMock.mockResolvedValue(createdUser);

    try {
      const response = await app.inject({
        method: "POST",
        url: "/register",
        payload: {
          username: "neworganizer",
          password: "StrongPass123",
          email: "new@org.com",
          role: "organizer",
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(201);
      expect(createOrganizerUserMock).toHaveBeenCalledWith({
        username: "neworganizer",
        password: "StrongPass123",
        email: "new@org.com",
        role: "organizer",
      });
      expect(response.json()).toEqual(createdUser);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า POST /logout คืนสถานะ 204 ตามที่กำหนด
  it("logs out without body response", async () => {
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: "POST",
        url: "/logout",
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe("");
    } finally {
      await app.close();
    }
  });
});
