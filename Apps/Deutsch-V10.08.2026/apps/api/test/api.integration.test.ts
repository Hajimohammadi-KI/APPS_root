import { afterEach, describe, expect, it } from 'bun:test';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import {
  bootstrapResponseSchema,
  evaluationResponseSchema,
  healthResponseSchema,
} from '@grammar/contracts';

import { AppModule } from '../src/app.module';

describe('HTTP API', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('serves health and bootstrap contracts over HTTP', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = testingModule.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');

    const baseUrl = `${await app.getUrl()}/api/v1`;

    const [healthResponse, bootstrapResponse] = await Promise.all([
      fetch(`${baseUrl}/health`),
      fetch(`${baseUrl}/bootstrap`),
    ]);

    expect(healthResponse.status).toBe(200);
    expect(bootstrapResponse.status).toBe(200);

    const health = healthResponseSchema.parse(await healthResponse.json());
    const bootstrap = bootstrapResponseSchema.parse(
      await bootstrapResponse.json(),
    );

    expect(health.status).toBe('ok');
    expect(bootstrap.content).toMatchObject({
      topics: 79,
      grammarUnits: 144,
    });

    process.env.LANGUAGE_TOOL_URL = 'http://127.0.0.1:1/v2/check';
    const evaluationResponse = await fetch(`${baseUrl}/evaluate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: 'Ich bin nach Berlin gegangen.',
        grammar: {
          title: 'Perfekt',
          rule: 'haben oder sein + Partizip II',
          examples: ['Ich bin nach Berlin gegangen.'],
        },
        kind: 'free',
      }),
    });
    expect(evaluationResponse.status).toBe(201);
    const evaluation = evaluationResponseSchema.parse(
      await evaluationResponse.json(),
    );
    expect(evaluation.online).toBe(false);
    expect(evaluation.ok).toBe(false);
  });
});
