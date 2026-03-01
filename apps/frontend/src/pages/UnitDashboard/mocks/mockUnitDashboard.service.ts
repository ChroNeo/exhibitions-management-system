import {
  mockUnitDashboardById,
  type UnitDashboardResponse,
} from "./mockUnitDashboard";

export async function fetchUnitDashboardMock(
  unitId: number,
): Promise<UnitDashboardResponse> {
  await new Promise<void>((r) => setTimeout(r, 300));
  const found = mockUnitDashboardById[unitId];
  if (!found) throw new Error(`Unit ${unitId} not found in mock`);
  return found;
}
