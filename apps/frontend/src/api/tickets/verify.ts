import axios from "axios";
import liffClient from "../liffClient";
import type { ScanResult } from "./types";

// FS3: Use liffClient instead of raw axios — consistent auth handling + mock mode support
export async function verifyTicket(token: string): Promise<ScanResult> {
  try {
    const response = await liffClient.post<ScanResult>("/ticket/verify", {
      token,
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
