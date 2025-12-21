import axios from 'axios';
import liff from '@line/liff';
import type { QRTokenResponse } from './types';

const BASE = import.meta.env.VITE_API_BASE;

export async function fetchQRToken(exhibitionId: string): Promise<QRTokenResponse> {
  const idToken = liff.getIDToken();
  if (!idToken) {
    throw new Error('Failed to get ID token');
  }

  if (!exhibitionId) {
    throw new Error('No exhibition selected. Please select an exhibition from the list.');
  }

  const response = await axios.get<QRTokenResponse>(
    `${BASE}/ticket/qr-token`,
    {
      params: { exhibition_id: exhibitionId },
      headers: {
        Authorization: `Bearer ${idToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
    }
  );

  return response.data;
}
