import { Injectable } from '@nestjs/common';

import { catalogSummary } from '@grammar/content';
import {
  apiVersion,
  bootstrapResponseSchema,
  cefrLevelSchema,
  type BootstrapResponse,
} from '@grammar/contracts';
import { DAILY_PRACTICE_STEPS, REVIEW_INTERVAL_DAYS } from '@grammar/domain';

@Injectable()
export class BootstrapService {
  getBootstrap(): BootstrapResponse {
    const payload = {
      apiVersion,
      product: {
        name: 'DeutschFlow',
        locale: 'de',
      },
      content: {
        topics: catalogSummary.topicCount,
        grammarUnits: catalogSummary.grammarUnitCount,
        levels: cefrLevelSchema.array().parse(catalogSummary.levels),
      },
      learning: {
        dailySteps: DAILY_PRACTICE_STEPS.map(({ id, label, minutes }) => ({
          id,
          label,
          minutes,
        })),
        reviewIntervalsDays: [...REVIEW_INTERVAL_DAYS],
      },
      capabilities: {
        persistence: 'local-first',
        sync: 'planned',
        languageFeedback: 'external',
      },
    } as const;

    return bootstrapResponseSchema.parse(payload);
  }
}
