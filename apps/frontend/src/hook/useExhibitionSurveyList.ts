import { useCallback } from 'react';
import { useLiff } from './useLiff';
import { getUserExhibitions, type UserTicket } from '../api/tickets';

export function useExhibitionSurveyList() {
  const fetchData = useCallback(async (): Promise<UserTicket[]> => {
    return await getUserExhibitions();
  }, []);

  return useLiff({
    liffApp: 'SURVEY',
    fetchData,
  });
}
