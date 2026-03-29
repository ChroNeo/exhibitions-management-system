import { useCallback } from 'react';
import { useLiff } from '../../../hooks';
import type { LiffAppType } from '../../../config/liff';
import { getQuestionsByExhibitionLiff } from '../../../api/survey';
import type { QuestionWithSet } from '../../../types/survey';

interface UseSurveyLiffOptions {
  exhibitionId?: string | null;
  type?: 'EXHIBITION' | 'UNIT';
  liffApp?: LiffAppType;
}

export function useSurveyLiff({
  exhibitionId,
  type = 'EXHIBITION',
  liffApp = 'EXHIBITION_SURVEY',
}: UseSurveyLiffOptions = {}) {
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
    liffApp,
    fetchData,
    dependencies: [exhibitionId, type, liffApp],
  });
}
