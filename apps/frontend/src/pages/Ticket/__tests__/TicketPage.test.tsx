// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const liffClientGetMock = vi.fn();
const ticketContentMock = vi.fn(
  ({ exhibitionId }: { exhibitionId: string }) => (
    <div data-testid="ticket-content">{exhibitionId}</div>
  ),
);
const swalFireMock = vi.fn();
const swalCloseMock = vi.fn();
const swalShowLoadingMock = vi.fn();

vi.mock("../../../api/liffClient", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => liffClientGetMock(...args),
  },
}));

vi.mock("../TicketContent", () => ({
  TicketContent: (props: { exhibitionId: string }) => ticketContentMock(props),
}));

vi.mock("../../../hooks/useLiff", () => ({
  isLiffMockEnabled: () => true,
}));

vi.mock("@line/liff", () => ({
  __esModule: true,
  default: {
    id: null,
    init: vi.fn(),
    isLoggedIn: vi.fn(() => false),
  },
}));

vi.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: (...args: unknown[]) => swalFireMock(...args),
    close: (...args: unknown[]) => swalCloseMock(...args),
    showLoading: (...args: unknown[]) => swalShowLoadingMock(...args),
  },
}));

import TicketPage from "../TicketPage";

function renderTicketPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/ticket" element={<TicketPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TicketPage", () => {
  beforeEach(() => {
    liffClientGetMock.mockReset();
    ticketContentMock.mockClear();
    swalFireMock.mockReset();
    swalCloseMock.mockReset();
    swalShowLoadingMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("uses the query param exhibitionId before current exhibition fallback", async () => {
    liffClientGetMock.mockResolvedValue({
      data: { current_exhibition_id: 1 },
    });

    renderTicketPage("/ticket?exhibitionId=101");

    expect(await screen.findByTestId("ticket-content")).toHaveTextContent("101");
    expect(ticketContentMock).toHaveBeenCalledWith({ exhibitionId: "101" });
    expect(liffClientGetMock).not.toHaveBeenCalled();
  });

  it("falls back to current exhibition when no query param is provided", async () => {
    liffClientGetMock.mockResolvedValue({
      data: { current_exhibition_id: 1 },
    });

    renderTicketPage("/ticket");

    expect(await screen.findByTestId("ticket-content")).toHaveTextContent("1");
    expect(liffClientGetMock).toHaveBeenCalledWith("/ticket/current-exhibition");
    expect(ticketContentMock).toHaveBeenCalledWith({ exhibitionId: "1" });
  });

  it("shows an error for an invalid exhibitionId query param without falling back", async () => {
    renderTicketPage("/ticket?exhibitionId=abc");

    await waitFor(() => {
      expect(swalFireMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          icon: "error",
          title: "Error",
          text: "Exhibition ID is invalid.",
        }),
      );
    });

    expect(liffClientGetMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("ticket-content")).not.toBeInTheDocument();
  });
});
