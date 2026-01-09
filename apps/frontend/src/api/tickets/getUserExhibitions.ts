import axios from 'axios';
import liff from '@line/liff';
import type { UserTicket } from './types';

const BASE = import.meta.env.VITE_API_BASE;

/**
 * Fetch all exhibitions the user has registered for
 */
export async function getUserExhibitions(): Promise<UserTicket[]> {
  const idToken = liff.getIDToken();
  if (!idToken) {
    throw new Error('Failed to get ID token');
  }

  const response = await axios.get<UserTicket[]>(
    `${BASE}/ticket`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
    }
  );

  return response.data;
}
