import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const useUnitsMock = vi.fn();
vi.mock("../../../hook/useUnits", () => ({
  useUnits: (...args: unknown[]) => useUnitsMock(...args),
}));

const useExhibitionMock = vi.fn();
vi.mock("../../../hook/useExhibition", () => ({
  useExhibition: (...args: unknown[]) => useExhibitionMock(...args),
}));

const useDeleteUnitMock = vi.fn();
vi.mock("../../../hook/useDeleteUnit", () => ({
  useDeleteUnit: () => useDeleteUnitMock(),
}));

const useAuthStatusMock = vi.fn();
vi.mock("../../../hook/useAuthStatus", () => ({
  useAuthStatus: () => useAuthStatusMock(),
}));

vi.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: vi.fn() },
}));

import UnitManageList from "../UnitManageList";

describe("UnitManageList handleSelect", () => {
  const mutateAsyncMock = vi.fn();
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    navigateMock.mockReset();
    mutateAsyncMock.mockReset();
    useUnitsMock.mockReset();
    useExhibitionMock.mockReset();
    useDeleteUnitMock.mockReset();
    useAuthStatusMock.mockReset();
    openSpy = vi.spyOn(window, "open").mockReturnValue(null);

    useUnitsMock.mockReturnValue({
      data: [
        {
          id: "unit-1",
          exhibitionId: 123,
          name: "Demo Unit",
          type: "booth",
          description: "Example description",
          descriptionHtml: undefined,
          descriptionDelta: undefined,
          staffUserIds: [],
          staffNames: [],
          posterUrl: undefined,
          posterPath: undefined,
          detailPdfUrl: undefined,
          detailPdfPath: undefined,
          startsAt: "2025-05-01T08:00:00Z",
          endsAt: "2025-05-01T09:00:00Z",
        },
      ],
      isLoading: false,
      isError: false,
    });

    useExhibitionMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    useDeleteUnitMock.mockReturnValue({ mutateAsync: mutateAsyncMock });
    useAuthStatusMock.mockReturnValue(false);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it("opens the detail PDF in a new tab when available", () => {
    useUnitsMock.mockReturnValueOnce({
      data: [
        {
          id: "unit-1",
          exhibitionId: 123,
          name: "Demo Unit",
          type: "booth",
          description: "Example description",
          descriptionHtml: undefined,
          descriptionDelta: undefined,
          staffUserIds: [],
          staffNames: [],
          posterUrl: undefined,
          posterPath: undefined,
          detailPdfUrl: "https://example.com/unit-1.pdf",
          detailPdfPath: "uploads/units/unit-1.pdf",
          startsAt: "2025-05-01T08:00:00Z",
          endsAt: "2025-05-01T09:00:00Z",
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter initialEntries={["/exhibitions/123/units"]}>
        <Routes>
          <Route path="/exhibitions/:id/units" element={<UnitManageList />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Demo Unit"));

    expect(openSpy).toHaveBeenCalledWith("https://example.com/unit-1.pdf", "_blank", "noopener,noreferrer");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("falls back to navigating to the unit detail when no PDF is set", () => {
    render(
      <MemoryRouter initialEntries={["/exhibitions/123/units"]}>
        <Routes>
          <Route path="/exhibitions/:id/units" element={<UnitManageList />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Demo Unit"));

    expect(openSpy).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/exhibitions/123/unit/unit-1");
  });
});
