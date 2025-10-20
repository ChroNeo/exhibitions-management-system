import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import exhibitionsController from "../exhibitions-controller.js";
import {
  addExhibitions,
  getExhibitionById,
  getExhibitionsList,
} from "../../queries/exhibitions_query.js";
import { registerSchemas } from "../../services/schema.js";

vi.mock("../../queries/exhibitions_query.js", () => ({
  getExhibitionsList: vi.fn(),
  getExhibitionById: vi.fn(),
  addExhibitions: vi.fn(),
}));

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
  await exhibitionsController(app);
  return app;
};

const getExhibitionsListMock = vi.mocked(getExhibitionsList);
const getExhibitionByIdMock = vi.mocked(getExhibitionById);
const addExhibitionsMock = vi.mocked(addExhibitions);

describe("exhibitionsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ทดสอบว่า GET / สามารถดึงรายการนิทรรศการจาก query layer ได้ครบ
  it("returns the exhibition list", async () => {
    const app = await buildApp();
    const mockedResponse = [
      {
        exhibition_id: 1,
        exhibition_code: "EXH-001",
        title: "Mock Expo",
        description: "Demo exhibition",
        start_date: "2025-01-01T09:00:00Z",
        end_date: "2025-01-05T17:00:00Z",
        location: "Hall A",
        organizer_name: "Org Inc",
        picture_path: null,
        status: "draft",
        created_by: 7,
      },
    ];
    getExhibitionsListMock.mockResolvedValue(mockedResponse);

    try {
      const response = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(response.statusCode).toBe(200);
      expect(getExhibitionsListMock).toHaveBeenCalledTimes(1);
      expect(response.json()).toEqual(mockedResponse);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า GET /:id ส่ง id ให้ query และคืนข้อมูลนิทรรศการเดียว
  it("fetches a single exhibition by id", async () => {
    const app = await buildApp();
    const mockedExhibition = {
      exhibition_id: 42,
      exhibition_code: "EXH-042",
      title: "Specific Expo",
      description: "Standalone event",
      start_date: "2025-02-01T09:00:00Z",
      end_date: "2025-02-03T17:00:00Z",
      location: "Hall B",
      organizer_name: "Org Inc",
      picture_path: null,
      status: "published",
      created_by: 5,
    };
    getExhibitionByIdMock.mockResolvedValue(mockedExhibition);

    try {
      const response = await app.inject({
        method: "GET",
        url: "/42",
      });

      expect(response.statusCode).toBe(200);
      expect(getExhibitionByIdMock).toHaveBeenCalledWith(42);
      expect(response.json()).toEqual(mockedExhibition);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า POST / รับ JSON แล้วเรียก addExhibitions พร้อม payload และคืนค่า 201
  it("creates a new exhibition from JSON payload", async () => {
    const app = await buildApp();
    const payload = {
      title: "New Expo",
      description: "Fresh event",
      start_date: "2025-01-01T10:00:00Z",
      end_date: "2025-01-10T18:00:00Z",
      location: "Main Hall",
      organizer_name: "Events Co",
      picture_path: "uploads/new-expo.jpg",
      status: "draft",
      created_by: 7,
    };
    const createdExhibition = { exhibition_id: 77, ...payload };
    addExhibitionsMock.mockResolvedValue(createdExhibition);

    try {
      const response = await app.inject({
        method: "POST",
        url: "/",
        payload,
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(201);
      expect(addExhibitionsMock).toHaveBeenCalledWith(payload);
      expect(response.json()).toEqual(createdExhibition);
    } finally {
      await app.close();
    }
  });
});
