import liffClient from '../liffClient';

export interface CheckInStatusResponse {
  checked_in: boolean;
  checkin_at: string | null;
  unit_id: number | null;
}

/**
 * Check if user has checked in to an exhibition
 */
export async function checkCheckInStatus(exhibitionId: string | number): Promise<CheckInStatusResponse> {
  const response = await liffClient.get<CheckInStatusResponse>(
    '/ticket/check-in-status',
    {
      params: {
        exhibition_id: String(exhibitionId),
      },
    }
  );

  return response.data;
}
