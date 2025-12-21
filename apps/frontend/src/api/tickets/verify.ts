import axios from 'axios';
import type { ScanResult } from './types';

const BASE = import.meta.env.VITE_API_BASE;

export async function verifyTicket(token: string): Promise<ScanResult> {
  try {
    const response = await axios.post<ScanResult>(`${BASE}/ticket/verify`, {
      token: token
    });

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
