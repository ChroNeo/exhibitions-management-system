import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import unitsController from "../units-controller.js";
import {
  addUnit,
  deleteUnit,
  getUnitsByExhibitionId,
  getUnitsById,
  updateUnit,
} from "../../queries/units-query.js";
import { registerSchemas } from "../../services/schema.js";

vi.mock("../../queries/units-query.js", () => ({
  getUnitsByExhibitionId: vi.fn(),
  getUnitsById: vi.fn(),
  addUnit: vi.fn(),
  updateUnit: vi.fn(),
  deleteUnit: vi.fn(),
}));

const getUnitsByExhibitionIdMock = vi.mocked(getUnitsByExhibitionId);
const getUnitsByIdMock = vi.mocked(getUnitsById);
const addUnitMock = vi.mocked(addUnit);
const updateUnitMock = vi.mocked(updateUnit);
const deleteUnitMock = vi.mocked(deleteUnit);

const buildApp = async () => {
  const app = Fastify({
    ajv: {
      customOptions: {
        strictSchema: false,
      },
    },
  });
  app.decorateRequest("isMultipart", function () {
    return false;
  });
  registerSchemas(app);
  await unitsController(app);
  return app;
};

describe("unitsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ทดสอบว่า GET /:ex_id/units ดึงข้อมูลหน่วยงานในนิทรรศการตามรหัส
  it("lists units for an exhibition", async () => {
    const app = await buildApp();
    const mockedResponse = [
      {
        unit_id: 10,
        exhibition_id: 123,
        unit_name: "Main Stage",
        unit_type: "booth",
        description: "Stage shows",
        description_delta: null,
        staff_user_id: 5,
        poster_url: "uploads/units/main-stage.png",
        starts_at: "2025-05-01T09:00:00Z",
        ends_at: "2025-05-01T17:00:00Z",
      },
    ];
    getUnitsByExhibitionIdMock.mockResolvedValue(mockedResponse);

    try {
      const response = await app.inject({
        method: "GET",
        url: "/123/units",
      });

      expect(response.statusCode).toBe(200);
      expect(getUnitsByExhibitionIdMock).toHaveBeenCalledWith(123);
      expect(response.json()).toEqual(mockedResponse);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า GET /:ex_id/units/:id ส่ง ex_id และ id เข้า query ถูกต้อง
  it("fetches a single unit by id", async () => {
    const app = await buildApp();
    const mockedUnit = {
      unit_id: 77,
      exhibition_id: 123,
      unit_name: "Demo Booth",
      unit_type: "booth",
      description: "Demo area",
      description_delta: null,
      staff_user_id: null,
      poster_url: null,
      starts_at: "2025-05-01T00:00:00Z",
      ends_at: "2025-05-01T00:00:00Z",
    };
    getUnitsByIdMock.mockResolvedValue([mockedUnit]);

    try {
      const response = await app.inject({
        method: "GET",
        url: "/123/units/77",
      });

      expect(response.statusCode).toBe(200);
      expect(getUnitsByIdMock).toHaveBeenCalledWith(123, 77);
      expect(response.json()).toEqual([mockedUnit]);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า POST /:ex_id/units แปลง payload แล้วส่งให้ addUnit
  it("creates a new unit", async () => {
    const app = await buildApp();
    const payload = {
      unit_name: "Stage Show",
      unit_type: "booth",
      description: "Daily performance",
      staff_user_id: 8,
      poster_url: "uploads/units/stage.png",
      starts_at: "2025-05-02T10:00:00Z",
      ends_at: "2025-05-02T12:00:00Z",
      description_delta: { ops: [{ insert: "Daily performance\n" }] },
    };
    const createdUnit = {
      unit_id: 12,
      exhibition_id: 123,
      ...payload,
      description_delta: JSON.stringify(payload.description_delta),
    };
    addUnitMock.mockResolvedValue(createdUnit);

    try {
      const response = await app.inject({
        method: "POST",
        url: "/123/units",
        payload,
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(201);
      expect(addUnitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exhibition_id: 123,
          unit_name: "Stage Show",
          unit_type: "booth",
          description: "Daily performance",
          description_delta: JSON.stringify(payload.description_delta),
          staff_user_id: 8,
          poster_url: "uploads/units/stage.png",
          starts_at: "2025-05-02T10:00:00Z",
          ends_at: "2025-05-02T12:00:00Z",
        })
      );
      expect(response.json()).toEqual(createdUnit);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า PUT /:ex_id/units/:id ส่งพารามิเตอร์และ payload ให้ updateUnit
  it("updates an existing unit", async () => {
    const app = await buildApp();
    const updatePayload = {
      unit_name: "Updated Stage",
      unit_type: "activity",
      description: "Updated program",
      poster_url: "uploads/units/updated.png",
      starts_at: "2025-05-03T10:00:00Z",
      ends_at: "2025-05-03T12:00:00Z",
      description_delta: "{\"ops\":[{\"insert\":\"Updated program\\n\"}]}",
    };
    const updatedUnit = {
      unit_id: 12,
      exhibition_id: 123,
      ...updatePayload,
      staff_user_id: null,
    };
    updateUnitMock.mockResolvedValue(updatedUnit);

    try {
      const response = await app.inject({
        method: "PUT",
        url: "/123/units/12",
        payload: updatePayload,
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(updateUnitMock).toHaveBeenCalledWith(
        123,
        12,
        expect.objectContaining({
          unit_name: "Updated Stage",
          unit_type: "activity",
          description: "Updated program",
          poster_url: "uploads/units/updated.png",
          starts_at: "2025-05-03T10:00:00Z",
          ends_at: "2025-05-03T12:00:00Z",
          description_delta: updatePayload.description_delta,
        })
      );
      expect(response.json()).toEqual(updatedUnit);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า DELETE /:ex_id/units/:id เรียก deleteUnit และคืน 204
  it("deletes a unit", async () => {
    const app = await buildApp();
    deleteUnitMock.mockResolvedValue(undefined);

    try {
      const response = await app.inject({
        method: "DELETE",
        url: "/123/units/12",
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe("");
      expect(deleteUnitMock).toHaveBeenCalledWith(123, 12);
    } finally {
      await app.close();
    }
  });
});
