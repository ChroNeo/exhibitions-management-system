import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import userController from "../user-controller.js";
import { getListUsers } from "../../queries/users-query.js";
import { registerSchemas } from "../../services/schema.js";

//เอาฟังก์ชัน getListUsers ออกไป ใช้ mock แทนจะได้ไม่ยิง DB
vi.mock("../../queries/users-query.js", () => ({
  getListUsers: vi.fn(),
}));

const buildApp = async () => {
  const app = Fastify();
  registerSchemas(app); // provide UserDropdownOption schema
  await userController(app);
  return app;
};

const getListUsersMock = vi.mocked(getListUsers);

describe("userController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ทดสอบว่า GET / ดึงผู้ใช้ทั้งหมดและแมประบบเป็น dropdown
  it("ดึงข้อมูลทั้งหมด", async () => {
    const app = await buildApp();
    const mockedResponse = [
      {
        user_id: 1,
        full_name: "John Doe",
      },
      {
        user_id: 2,
        full_name: "Jane Doe",
      },
    ];
    getListUsersMock.mockResolvedValue(mockedResponse);
    try {
      const response = await app.inject({
        method: "GET",
        url: "/",
      });
      expect(response.statusCode).toBe(200);
      expect(getListUsersMock).toHaveBeenCalledWith(undefined);
      expect(response.json()).toEqual([
        { value: 1, label: "John Doe" },
        { value: 2, label: "Jane Doe" },
      ]);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า GET /?role=staff ส่ง role เข้า query และคืนข้อมูลเฉพาะ role นั้น
  it("กรองตาม role", async () => {
    const app = await buildApp();
    const mockedResponse = [
      {
        user_id: 3,
        full_name: "Staff One",
      },
    ];
    getListUsersMock.mockResolvedValue(mockedResponse);
    try {
      const response = await app.inject({
        method: "GET",
        url: "/",
        query: { role: "staff" },
      });
      expect(response.statusCode).toBe(200);
      expect(getListUsersMock).toHaveBeenCalledWith("staff");
      expect(response.json()).toEqual([{ value: 3, label: "Staff One" }]);
    } finally {
      await app.close();
    }
  });
});
