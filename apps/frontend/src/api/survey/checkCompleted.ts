import axios from 'axios';
import liff from '@line/liff';

const BASE_URL = import.meta.env.VITE_API_BASE;

export interface CheckCompletedResponse {
  is_completed: boolean;
}

/**
 * Check if user has completed a survey for an exhibition or unit
 */
export async function checkSurveyCompleted(
  exhibitionId: string | number,
  unitId?: string | number
): Promise<boolean> {
  const idToken = liff.getIDToken();
  if (!idToken) {
    throw new Error('Failed to get ID token');
  }

  const params: any = {
    exhibition_id: String(exhibitionId),
  };

  if (unitId !== undefined) {
    params.unit_id = String(unitId);
  }

  const response = await axios.get<CheckCompletedResponse>(
    `${BASE_URL}/survey/check-completed`,
    {
      params,
      headers: {
        Authorization: `Bearer ${idToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
    }
  );

  return response.data.is_completed;
}
