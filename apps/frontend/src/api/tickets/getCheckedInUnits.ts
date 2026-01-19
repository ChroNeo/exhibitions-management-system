import liffClient from '../liffClient';

export interface CheckedInUnit {
  unit_id: number;
  unit_name: string;
  checkin_at: string;
  survey_completed: boolean;
}

/**
 * Get all units that user has checked in to for an exhibition
 */
export async function getCheckedInUnits(exhibitionId: string | number): Promise<CheckedInUnit[]> {
  const response = await liffClient.get<CheckedInUnit[]>(
    '/ticket/checked-in-units',
    {
      params: {
        exhibition_id: String(exhibitionId),
      },
    }
  );

  return response.data;
}
