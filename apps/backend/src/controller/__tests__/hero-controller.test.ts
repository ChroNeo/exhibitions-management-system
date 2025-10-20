import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import heroController from "../hero-controller.js";
import { getFeature } from "../../queries/feature-query.js";

// Replace the real query module so the test does not hit the DB.
vi.mock("../../queries/feature-query.js", () => ({
  getFeature: vi.fn(),
}));

// Helper to build a Fastify instance with just the hero routes registered.
const buildApp = () => {
  const app = Fastify();
  heroController(app);
  return app;
};

// Strongly typed handle to the mocked getFeature function.
const getFeatureMock = vi.mocked(getFeature);

describe("heroController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ทดสอบว่า controller ส่งต่อ query params ให้ getFeature และคืนผล mock
  it("คืนค่าข้อมูล feature จากการใส่ query", async () => {
    const app = buildApp();
    const mockedResponse = {
      featureImages: [
        { type: "banner", image: "/banner.jpg", href: "/banner" },
        { type: "exhibition", image: "/exhibition.jpg", href: "/exhibitions/1" },
      ],
      exhibitions: [{ exhibition_id: 1, title: "Exhibition" }],
    };

    // Stub the DB call to return canned feature content.
    getFeatureMock.mockResolvedValue(mockedResponse);

    try {
      // Simulate an HTTP GET request with query parameters.
      const response = await app.inject({
        method: "GET",
        url: "/",
        query: { limit: "3", status: "published,ongoing" },
      });

      expect(response.statusCode).toBe(200);
      expect(getFeatureMock).toHaveBeenCalledWith({
        limit: "3",
        status: "published,ongoing",
      });
      expect(response.json()).toEqual(mockedResponse);
    } finally {
      await app.close();
    }
  });

  // ทดสอบว่า controller ใช้ค่า default เมื่อลูกค้าไม่ส่ง query มา
  it("uses default query values when none provided", async () => {
    const app = buildApp();
    const mockedResponse = { featureImages: [], exhibitions: [] };

    // Return an empty result to confirm controller passes defaults through.
    getFeatureMock.mockResolvedValue(mockedResponse);

    try {
      // No query params supplied; controller should fall back to defaults.
      const response = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(response.statusCode).toBe(200);
      expect(getFeatureMock).toHaveBeenCalledWith({
        limit: undefined,
        status: undefined,
      });
      expect(response.json()).toEqual(mockedResponse);
    } finally {
      await app.close();
    }
  });
});
