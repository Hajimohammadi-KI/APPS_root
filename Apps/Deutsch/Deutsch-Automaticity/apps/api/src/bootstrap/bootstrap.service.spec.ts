import { describe, expect, it } from 'bun:test';

import { bootstrapResponseSchema } from '@grammar/contracts';

import { BootstrapService } from './bootstrap.service';

describe('BootstrapService', () => {
  it('describes the migrated catalog and learning engine', () => {
    const result = new BootstrapService().getBootstrap();

    expect(bootstrapResponseSchema.safeParse(result).success).toBe(true);
    expect(result.content).toEqual({
      topics: 79,
      grammarUnits: 144,
      levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    });
    expect(result.learning.dailySteps).toHaveLength(3);
    expect(result.learning.reviewIntervalsDays).toEqual([1, 3, 7, 14, 30]);
  });
});
