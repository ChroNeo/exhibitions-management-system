import liffClient from '../liffClient';
import type { QRTokenResponse } from './types';

export async function fetchQRToken(exhibitionId: string): Promise<QRTokenResponse> {
  if (!exhibitionId) {
    throw new Error('No exhibition selected. Please select an exhibition from the list.');
  }

  const response = await liffClient.get<QRTokenResponse>(
    '/ticket/qr-token',
    {
      params: { exhibition_id: exhibitionId },
    }
  );

  return response.data;
}
