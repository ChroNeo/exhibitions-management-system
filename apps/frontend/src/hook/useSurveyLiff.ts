import { useCallback } from 'react';
import { useLiff } from './useLiff';
import { getQuestionsByExhibitionLiff } from '../api/survey';
import type { QuestionWithSet } from '../types/survey';

interface UseSurveyLiffOptions {
  exhibitionId?: string | null;
  type?: 'EXHIBITION' | 'UNIT';
}

export function useSurveyLiff({ exhibitionId, type = 'EXHIBITION' }: UseSurveyLiffOptions = {}) {
  const fetchData = useCallback(async (): Promise<QuestionWithSet[]> => {
    if (!exhibitionId) {
      throw new Error('No exhibition ID provided');
    }

    return await getQuestionsByExhibitionLiff({
      exhibition_id: exhibitionId,
      type,
    });
  }, [exhibitionId, type]);

  return useLiff({
    liffApp: 'SURVEY',
    fetchData,
    dependencies: [exhibitionId, type],
  });
}
