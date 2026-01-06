import axios from 'axios';
import liff from '@line/liff';
import type { ScanResult } from './types';

const BASE = import.meta.env.VITE_API_BASE;

export async function verifyTicket(token: string): Promise<ScanResult> {
  try {
    // Get LIFF ID token for authentication
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('Failed to get ID token. Please login again.');
    }
    const response = await axios.post<ScanResult>(
      `${BASE}/ticket/verify`,
      {
        token: token
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    return response.data;
  } catch (err: unknown) {
    // Handle axios error response that contains ScanResult
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as ScanResult;
    }

    // Re-throw other errors
    throw err;
  }
}
