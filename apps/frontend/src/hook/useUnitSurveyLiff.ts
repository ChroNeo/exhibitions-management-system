import { useCallback } from 'react';
import { useLiff } from './useLiff';
import { getQuestionsByExhibitionLiff, checkSurveyCompletedLiff } from '../api/survey';
import type { QuestionWithSet } from '../types/survey';

export interface UnitSurveyData {
  questions: QuestionWithSet[];
  isCompleted: boolean;
}

interface UseUnitSurveyLiffOptions {
  exhibitionId?: string | null;
  unitId?: string | null;
}

export function useUnitSurveyLiff({ exhibitionId, unitId }: UseUnitSurveyLiffOptions = {}) {
  const fetchData = useCallback(async (): Promise<UnitSurveyData> => {
    if (!exhibitionId) {
      throw new Error('No exhibition ID provided');
    }

    if (!unitId) {
      throw new Error('No unit ID provided');
    }

    const [questions, isCompleted] = await Promise.all([
      getQuestionsByExhibitionLiff({
        exhibition_id: exhibitionId,
        type: 'UNIT',
      }),
      checkSurveyCompletedLiff(exhibitionId, unitId),
    ]);

    return { questions, isCompleted };
  }, [exhibitionId, unitId]);

  return useLiff({
    liffApp: 'UNIT_SURVEY',
    fetchData,
    dependencies: [exhibitionId, unitId],
  });
}
