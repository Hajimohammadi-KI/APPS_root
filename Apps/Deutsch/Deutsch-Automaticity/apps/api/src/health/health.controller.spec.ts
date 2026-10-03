import { describe, expect, it } from 'bun:test';

import { healthResponseSchema } from '@grammar/contracts';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a contract-valid health response', () => {
    const result = new HealthController().getHealth();

    expect(healthResponseSchema.safeParse(result).success).toBe(true);
    expect(result.status).toBe('ok');
  });
});
