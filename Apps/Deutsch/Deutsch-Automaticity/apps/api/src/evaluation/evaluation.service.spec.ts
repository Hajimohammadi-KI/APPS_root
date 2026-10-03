import { afterEach, describe, expect, it, mock } from 'bun:test';

import { EvaluationService } from './evaluation.service';

const grammar = {
  title: 'Perfekt',
  rule: 'Das Perfekt besteht aus Hilfsverb und Partizip II.',
  examples: ['Ich bin gegangen.'],
};

describe('EvaluationService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('uses LanguageTool matches and applies their first replacements', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        Response.json({
          matches: [
            {
              offset: 4,
              length: 4,
              message: 'Möglicher Tippfehler',
              replacements: [{ value: 'bin' }],
              rule: { issueType: 'misspelling' },
            },
          ],
        }),
      ),
    ) as unknown as typeof fetch;

    const report = await new EvaluationService().evaluate({
      text: 'Ich binn gegangen.',
      grammar,
      kind: 'free',
    });

    expect(report.online).toBe(true);
    expect(report.corrected).toBe('Ich bin gegangen.');
    expect(report.ok).toBe(false);
  });

  it('returns useful offline feedback without falsely passing', async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error('offline')),
    ) as unknown as typeof fetch;

    const report = await new EvaluationService().evaluate({
      text: 'Ich habe gegangen.',
      grammar,
      kind: 'free',
    });

    expect(report.online).toBe(false);
    expect(report.corrected).toBe('Ich bin gegangen.');
    expect(report.ok).toBe(false);
    expect(report.networkError).toContain('offline');
  });
});
