import liffClient from '../liffClient';
import type { UserTicket } from './types';

/**
 * Fetch all exhibitions the user has registered for
 */
export async function getUserExhibitions(): Promise<UserTicket[]> {
  const response = await liffClient.get<UserTicket[]>('/ticket');

  return response.data;
}
